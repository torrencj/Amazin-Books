var inquirer = require('inquirer');
var mysql = require('mysql');
var Table = require('cli-table');
const PASS = 'barf'; //Your password.

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: PASS,
  database: "amazin"
});


function connect() {
  connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
  });
}

//Customer display for all products.
function displayProductsCustomer() {
  return new Promise(function(resolve, reject) {
      connection.query('SELECT item_id, item_name, department, price FROM products', (err,res) => {
        if (err) throw err;
        var table = new Table({
          head: ['id', 'Product', 'Department', 'Price']
        });
        for (var i = 0; i < res.length; i++) {
          table.push([res[i].item_id, res[i].item_name, res[i].department, res[i].price]);
        }
        resolve(table.toString());
      });
  });
}

//Admin display for all products.
function displayProductsAdmin() {
  return new Promise(function(resolve, reject) {
      connection.query('SELECT item_id, item_name, department, price, quantity FROM products', (err,res) => {
        if (err) throw err;
        var table = new Table({
          head: ['id', 'Product', 'Department', 'Price', 'quantity']
        });
        for (var i = 0; i < res.length; i++) {
          table.push([res[i].item_id, res[i].item_name, res[i].department, res[i].price, res[i].quantity]);
        }
        resolve(table.toString());
      });
  });
}

function displayIdAdmin(id) {
  return new Promise(function(resolve, reject) {
      connection.query('SELECT * FROM products where item_id=?', [id], (err,res) => {
        if (err) throw err;
        var table = new Table({
          head: ['id', 'Product', 'Department', 'Price', 'quantity']
        });
        for (var i = 0; i < res.length; i++) {
          table.push([res[i].item_id, res[i].item_name, res[i].department, res[i].price, res[i].quantity]);
        }
        resolve(table.toString());
      });
  });
}

//get new product info from the user
function getNewProductInfo() {
  return new Promise(function(resolve, reject) {
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Enter the product name:"
        },
        {
          type: "input",
          name: "dept",
          message: "Enter the department:"
        },
        {
          type: "input",
          name: "price",
          message: "Enter the price:"
        },
        {
          type: "input",
          name: "quantity",
          message: "Enter the quantity:"
        }
      ]).then(resp => {
        if (!resp) reject(resp);
        resolve(resp);
      })
  });
}

//add new product to the database
function addNewProduct(item) {
  return new Promise(function(resolve, reject) {
      connection.query("INSERT INTO products VALUES(item_id, ?, ?, ?, ?)", [item.name, item.dept, item.price, item.quantity], (err, res) => {
        if (err) reject(err);
        resolve(`${item.name} added successfully.`);
      });
  });
}


//Amount needs to be a string like '+2' '-12'
function changeQuantity(itemID, amount) {
  return new Promise(function(resolve, reject) {
    connection.query("select quantity from products where item_id=?", [itemID], (err, res) => {
      if (err) throw err;
      //res[0] because we should only get one result, I hope
      if (res[0].quantity) {
        if (res[0].quantity >= amount) {
          connection.query("update products set quantity=quantity+? where item_id=?", [amount, itemID], (err, res) => {
            if (err) reject(err);
            console.log(`Item quantity changed by ${amount}`);
            resolve();
          });
        } else {
          console.log("Insufficient quantity to complete transaction.");
          resolve("unchanged");
        }
      } else {
        reject("failed");
      }
    });
  });
}

//ask to quit
function allDone() {
    inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: "Would you like to quit?"
      }
    ]).then(resp => {
      if (resp.continue) {
        connection.end();
        console.log("See ya.");
      } else {
        main();
      }
    })
}


function displayProductsLowStock() {
  return new Promise(function(resolve, reject) {
    connection.query("select * from products where quantity < 5", (err, res) => {
      if (err) throw err;
      var table = new Table({
        head: ['id', 'Product', 'Department', 'Price', 'quantity']
      });
      for (var i = 0; i < res.length; i++) {
        table.push([res[i].item_id, res[i].item_name, res[i].department, res[i].price, res[i].quantity]);
      }
      resolve(table.toString());
    })
  });
}


//Unused
function setNewUser() {
  return new Promise(function(resolve, reject) {
      inquirer.prompt([
        {
          type: "input",
          name: "userName",
          message: "Welcome, please set your username:"
        },
        {
          type: "input",
          name: "password",
          message: "Now set your password:"
        }
      ]).then( result =>{
        resolve(result);
      });
  });
}

//Unused
function loginUser() {
  return new Promise(function(resolve, reject) {
      inquirer.prompt([
        {
          type: "input",
          name: "userName",
          message: "Username:"
        },
        {
          type: "input",
          name: "password",
          message: "Password:"
        }
      ]).then( result =>{
        resolve(result);
      });
  });
}


function customerMenu() {
  return new Promise(function(resolve, reject) {
    var customerPrompt = [
      {
        type: "list",
        name: "action",
        message: "Hi customer, what would you like to do?",
        choices: ["Buy", "Exit"]
      }
    ];

    var buyPrompt = [
      {
        type: "input",
        name: "productId",
        message: "Enter the product id that you would like to buy."
      },
      {
        type: "input",
        name: "count",
        message: "How many?"
      }
    ];

    inquirer.prompt(customerPrompt).then(resp => {
      console.log(resp.action);
      if (resp.action == "Buy") {
        displayProductsCustomer().then(resp =>{
          console.log(resp);
          inquirer.prompt(buyPrompt).then(resp => {
            console.log(resp);
            changeQuantity(resp.productId, `-${resp.count}`).then(resp => {
              allDone();
            })
            resolve("success");
          })
        })
      } else {
        allDone();
      //not buy.
      }
    })
  });
}


function adminMenu() {
  return new Promise(function(resolve, reject) {
    var adminPrompt = [
      {
        type: "list",
        name: "action",
        message: "Hi admin, what would you like to do?",
        choices: ["Show stock", "Show low stock items", "Increase quantity", "Add new product"]
      }
    ];

    inquirer.prompt(adminPrompt).then(resp => {
      if (resp.action == adminPrompt[0].choices[0]) {
        //show all
        displayProductsAdmin().then(res => {
          resolve(console.log(res)); //I don't know what to put in resolve parens....
        });
      } else if (resp.action == adminPrompt[0].choices[1]) {
        displayProductsLowStock().then(res => {
          resolve(console.log(res));
        })
      } else if (resp.action == adminPrompt[0].choices[2]) {
          inquirer.prompt([
            {
              type:"input",
              name:"item_id",
              message:"Enter the item id you wish to add to"
            },
            {
              type:"input",
              name:"quantity",
              message:"Enter the quantity to add"
            }
          ]).then(res => {
          changeQuantity(res.item_id, res.quantity).then(res => {
            resolve(console.log(res));
          });
        });
      } else if (resp.action == adminPrompt[0].choices[3]) {
        getNewProductInfo().then(res =>{
          addNewProduct(res).then(res=>{
            resolve(console.log(res););
          })
        })
      }
    });
  });
}


//main menu
function main() {
  var mainPrompt = [
    {
      type: "list",
      name: "main",
      message: "Welcome, user, please log in:",
      choices: ["Customer", "Admin", "Exit"]
    }
  ];

  inquirer.prompt(mainPrompt).then(response => {
    if (response.main == 'Customer') {
      customerMenu();
    } else if (response.main == 'Admin') {
      adminMenu().then(res => {
        allDone()
      });
    } else {
      allDone();
    }
  });
}


connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  main();
});
