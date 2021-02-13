const express = require('express')
const router = express.Router()
const axios = require('axios')
const knex = require('knex')

const createDatabase = async (databaseName, schoolName) => {
  const knexConfig = {
    client: 'postgresql',
    connection: {
      database: 'catalog',
      host: process.env.PG_HOST,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    },
  }

  // first create a new database
  const knexCatalogDb = knex(knexConfig)
  await knexCatalogDb.raw(`create database ${databaseName}`)

  // register the new database in the catalog.schools table
  await knexCatalogDb('schools').insert({
    school_database: databaseName,
    school_name: schoolName,
  })

  // create a new connection to the new database
  // and migrate it to latest
  knexConfig.connection.database = databaseName
  const tenantKnex = knex(knexConfig)
  await tenantKnex.migrate.latest({
    directory: './database/app_migrations',
  })
}

const getDatabaseName = (schoolName) => {
  return schoolName.replace(/ /g, '_').toLowerCase()
}

const getAuth0AccessToken = async () => {
  const body = {
    grant_type: 'client_credentials',
    client_id: process.env.AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
  }
  const response = await axios.post(
    `${process.env.AUTH0_ISSUER}oauth/token`,
    body
  )
  return response.data.access_token
}

router.post('/', async function (req, res) {
  const dbName = getDatabaseName(req.body.schoolName)
  try {
    const user = {
      email: req.body.email,
      password: req.body.password,
      connection: 'Username-Password-Authentication',
      app_metadata: {
        school_name: req.body.schoolName,
        school_database: dbName,
      },
    }

    const token = await getAuth0AccessToken()
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await axios.post(
      `${process.env.AUTH0_ISSUER}api/v2/users`,
      user,
      config
    )

    // call the new createDatabase function here!
    await createDatabase(dbName, req.body.schoolName)

    res.send(response.data)
  } catch (e) {
    console.log(e)
    res
      .status(500)
      .send({ message: 'Error creating user', error: e.toString() })
  }
})

module.exports = router
