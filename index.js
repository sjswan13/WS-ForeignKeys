require('dotenv').config()
console.log(process.env)

const pg = require('pg'),
const express = require('express');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 
  'postgres://localhost/acme_hr_directory_db');
const port = process.env.port || 3000

app.use(express.json());
app.use(require('morgan')('dev'));

//GET-READ
app.get('/api/departments', async(req, res, next) => {
  try {
    const SQL = /*SQL*/`
    SELECT * from departments
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch(ex) {
    next(ex)
  }
})

//GET-READ
app.get('/api/employees', async(req, res, next) => {
  try {
    const SQL = /*SQL*/`
    SELECT * from emplyees ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch(ex) {
    next(ex)
  }
})

//POST-CREATE
app.post('/api/employees', async(req, res, next) => {
  try {
    const SQL = /*SQL*/ `
    INSERT INTO employees(name, department_id)
    VALUES($1, $2)
    RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id
    ])
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex)
  }
})

//DELETE
app.delete('/api/employees/:id', async(req, res, next) => {
  try {
    const SQL = /*SQL*/`
    DELETE from employees
    WHERE id = $1
    `
    const response = await client.query(SQL, [
      req.params.id
    ])
    res.sendStatus(204)
  } catch(ex) {
    next(ex)
  }
})

//PUT-UPDATE
app.put('/api/employees/:id', async(req, res, next) => {
  try {
    const SQL = /*SQL*/`
    UPDATE employees
    SET name=$1, department_id=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id
    ])
    res.send(response.rows[0])
  } catch(ex) {
    next(ex)
  }
})

app.use((err, req, res, next) => {
  res.status(500).send({ error: err.message });
});

const init = async () => {
  await client.connect();
  console.log('db_connected')

  //SQL table step

let SQL = /*SQL*/ `
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY, 
  name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY, 
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  department_id INTEGER REFERENCES departments(id) NOT NULL
);
`;

await client.query(SQL)
console.log('table created')

SQL = /*SQL*/ `
INSERT INTO departments (name) 
VALUES 
  ('Human Resources'), 
  ('Administration'), 
  ('Worker Bees'), 
  ('Clean Up Crew');
`;
await client.query(SQL);

SQL = /*SQL*/ `
INSERT INTO employees(name, department_id) 
VALUES 
  ('Hank', 1),
  ('Shirley', 2),
  ('Tom', 3),
  ('Cyndy', 4);
`;
await client.query(SQL);
console.log('data seeded');

app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();