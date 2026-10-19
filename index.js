require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS || '';
const CUSTOM_OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE || '';
const CUSTOM_PROPERTIES = ['name', 'bio', 'habitat'];

// Route 1: homepage lists garden plant custom object records.
app.get('/', async (req, res) => {
    const plantsUrl = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    const pageTitle = 'Garden Plants | Integrating With HubSpot I Practicum';

    try {
        const records = [];
        let nextUrl = plantsUrl;
        let params = {
            properties: CUSTOM_PROPERTIES.join(','),
            limit: 100
        };

        while (nextUrl) {
            const resp = await axios.get(nextUrl, { headers, params });
            records.push(...(resp.data.results || []));
            nextUrl = resp.data.paging && resp.data.paging.next ? resp.data.paging.next.link : null;
            params = undefined;
        }

        res.render('homepage', { title: pageTitle, data: records });
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.render('homepage', {
            title: pageTitle,
            data: [],
            error: 'Could not load garden plants from HubSpot.'
        });
    }
});

// Route 2: form for a new garden plant record.
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
    });
});

// Route 3: create the garden plant record, then return to the homepage.
app.post('/update-cobj', async (req, res) => {
    const createUrl = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    const payload = {
        properties: {
            name: req.body.name,
            bio: req.body.bio,
            habitat: req.body.habitat
        }
    };

    try {
        await axios.post(createUrl, payload, { headers });
        res.redirect('/');
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).render('updates', {
            title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
            error: 'Could not create the garden plant in HubSpot.'
        });
    }
});

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));