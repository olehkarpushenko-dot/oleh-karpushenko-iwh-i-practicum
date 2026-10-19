require('dotenv').config();
const axios = require('axios');

const token = process.env.PRIVATE_APP_ACCESS;
if (!token) {
    console.error('Set PRIVATE_APP_ACCESS in .env. Do not commit that file.');
    process.exit(1);
}

const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
};

const plants = [
    {
        name: 'Monstera Deliciosa',
        bio: 'A climbing aroid with split leaves, grown as a houseplant.',
        habitat: 'Tropical forest understory'
    },
    {
        name: 'Olive Tree',
        bio: 'A long-lived evergreen tree grown for fruit and silvery foliage.',
        habitat: 'Mediterranean hillsides'
    },
    {
        name: 'English Lavender',
        bio: 'A fragrant shrub used in gardens and dried bundles.',
        habitat: 'Dry sunny slopes'
    }
];

async function findOrCreateSchema() {
    const body = {
        name: 'garden_plant',
        description: 'Plants kept in a garden collection.',
        labels: {
            singular: 'Garden Plant',
            plural: 'Garden Plants'
        },
        primaryDisplayProperty: 'name',
        secondaryDisplayProperties: ['bio', 'habitat'],
        requiredProperties: ['name'],
        searchableProperties: ['name', 'bio', 'habitat'],
        properties: [
            { name: 'name', label: 'Name', type: 'string', fieldType: 'text' },
            { name: 'bio', label: 'Bio', type: 'string', fieldType: 'text' },
            { name: 'habitat', label: 'Habitat', type: 'string', fieldType: 'text' }
        ],
        associatedObjects: ['0-1']
    };

    try {
        const created = await axios.post('https://api.hubapi.com/crm-object-schemas/v3/schemas', body, { headers });
        return created.data;
    } catch (error) {
        const listed = await axios.get('https://api.hubapi.com/crm-object-schemas/v3/schemas', { headers });
        const existing = (listed.data.results || []).find((item) => item.name === 'garden_plant');
        if (!existing) {
            throw error;
        }
        return existing;
    }
}

async function portalId() {
    try {
        const account = await axios.get('https://api.hubapi.com/account-info/v3/details', { headers });
        return account.data.portalId;
    } catch (error) {
        const me = await axios.get('https://api.hubapi.com/integrations/v1/me', { headers });
        return me.data.portalId;
    }
}

async function main() {
    const schema = await findOrCreateSchema();
    const objectType = schema.objectTypeId;

    for (const plant of plants) {
        await axios.post(
            `https://api.hubapi.com/crm/v3/objects/${objectType}`,
            { properties: plant },
            { headers }
        );
        console.log(`Created ${plant.name}`);
    }

    const accountId = await portalId();
    console.log(`CUSTOM_OBJECT_TYPE=${objectType}`);
    console.log(`https://app.hubspot.com/contacts/${accountId}/objects/${objectType}/views/all/list`);
}

main().catch((error) => {
    console.error(error.response ? error.response.data : error.message);
    process.exit(1);
});
