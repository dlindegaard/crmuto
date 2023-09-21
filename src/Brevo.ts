import './Interfaces';

class BrevoAPI implements CrmAPI {
    private url = 'api.brevo.com/v3';
    private apiKey: string;
    private proxyUrl: string;
    private lastRequestTime: number;

    constructor(apiKey: string, proxyUrl: string) {
        this.apiKey = apiKey;
        this.proxyUrl = proxyUrl;
        this.url = this.proxyUrl + "/" + this.url;
        this.lastRequestTime = Date.now();
    }

    // Function to delay execution if needed
    private async delayIfNeeded(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < 100) {
            const delay = 100 - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.lastRequestTime = Date.now();
    }

    async getDeal(id: string): Promise<Deal> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        try {
            const dealResponse = await fetch(this.url + '/crm/deals/' + id, {
                method: 'GET',
                headers: headers
            });

            if (!dealResponse.ok) {
                throw new Error('HTTP error ' + dealResponse.status);
            }

            const dealData = await dealResponse.json();

            return {
                id: dealData.id,
                attributes: dealData.attributes
            };

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }

        return {
            id: '',
            attributes: {}
        };
    }
    async createDeal(name: string, contact?: Contact, attributes?: { [key: string]: string }): Promise<Deal> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json'
        };

        let data: any = {
            name: name
        };

        if (attributes) {
            data.attributes = attributes;
        }

        try {
            const response = await fetch(`${this.url}/crm/deals`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

            const responseData = await response.json();

            if (contact) {
                // Get class name
                const className = this.constructor.name;

                let brevoId = contact.id.find(id => id.crm == className);

                if (brevoId != undefined) {
                    await this.linkContactWithDeal(responseData.id, brevoId.id);
                }
            }

            // Use the getDeal method to fetch the newly created deal
            return await this.getDeal(responseData.id);

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);

        }

        return {
            id: '',
            attributes: {}
        };
    }
    async linkContactWithDeal(dealId: string, contactId: number): Promise<void> {
        await this.delayIfNeeded();
        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json'
        };

        const data = {
            "linkContactIds": [
                contactId
            ]
        };

        try {
            const response = await fetch(`${this.url}/crm/deals/link-unlink/${dealId}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }
    }
    getContact(id: string): Promise<Contact> {
        throw new Error('Method not implemented.');
    }
    async getLists(): Promise<List[]> {
        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let lists: List[] = [];

        let count = 0;

        do {
            await this.delayIfNeeded();
            try {
                const url = `${this.url}/contacts/lists?limit=50&offset=${lists.length == 0 ? 0 : lists.length - 1}&sort=desc`;

                // Use Fetch API to get the data
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }

                const data = await response.json();

                // The data is a json object with a data property ("lists") holding the lists in an array
                // The data includes id, name, folderId, uniqueSubscribers (number), totalSubscribers (number), totalBlacklisted (number)
                // iterate through the data and create a List object for each list and add it to the array

                for (let list of data.lists) {
                    lists.push({
                        id: list.id,
                        name: list.name,
                        folderId: list.folderId,
                        meta: {
                            uniqueSubscribers: list.uniqueSubscribers,
                            totalSubscribers: list.totalSubscribers,
                            totalBlacklisted: list.totalBlacklisted
                        }
                    });
                }

                count = data.count;

                return lists;
            } catch (error) {
                console.error('Error:', error);
                throw new Error('Error:' + error);
            }
        } while (lists.length < count);

        return [];
    }
    getList(id: string): Promise<List> {
        throw new Error('Method not implemented.');
    }
    async getContactsByList(listId: string): Promise<Contact[]> {
        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let contacts: Contact[] = [];
        let count = 0;

        do {
            await this.delayIfNeeded();
            try {
                const url = `${this.url}/contacts/lists/${listId}/contacts?limit=50&offset=${contacts.length == 0 ? 0 : contacts.length - 1}&sort=desc`;

                // Use Fetch API to get the data
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }

                const data = await response.json();

                // The data is a json object with a data property ("contacts") holding the contacts in an array
                // iterate through the data and create a Contact object for each contact and add it to the array
                for (let contact of data.contacts) {

                    let attributes: { [key: string]: string } = {};

                    // loop through contact attributes adding them to the attributes object - except keys "FIRSTNAME" and "LASTNAME"
                    for (let key in contact.attributes) {
                        if (key != "FIRSTNAME" && key != "LASTNAME") {
                            attributes[key] = contact.attributes[key];
                        }
                    }

                    // Get class name
                    const className = this.constructor.name;

                    contacts.push({
                        email: contact.email,
                        id: [{ id: contact.id, crm: className }], // Assuming the CRM name is 'Brevo'
                        firstName: contact.attributes.FIRSTNAME,
                        lastName: contact.attributes.LASTNAME,
                        attributes: contact.attributes,
                        listIds: contact.listIds.map(String) // Convert number list IDs to string
                    });
                }

                count = data.count;

            } catch (error) {
                console.error('Error:', error);
                throw new Error('Error:' + error);
            }
        } while (contacts.length < count);

        return contacts;
    }
    async getContacts(limit: number, offset: number): Promise<ContactsResult> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let contacts: Contact[] = [];
        let count = 0;

        try {
            const url = `${this.url}/contacts?limit=${limit}&offset=${offset}&sort=desc`;
            // Use Fetch API to get the data
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

            const data = await response.json();

            // The data is a json object with a data property ("contacts") holding the contacts in an array
            // iterate through the data and create a Contact object for each contact and add it to the array
            for (let contact of data.contacts) {

                let attributes: { [key: string]: string } = {};

                // loop through contact attributes adding them to the attributes object - except keys "FIRSTNAME" and "LASTNAME"
                for (let key in contact.attributes) {
                    if (key != "FIRSTNAME" && key != "LASTNAME") {
                        attributes[key] = contact.attributes[key];
                    }
                }

                // Get class name
                const className = this.constructor.name;

                contacts.push({
                    email: contact.email,
                    id: [{ id: contact.id, crm: className }], // Assuming the CRM name is 'Brevo'
                    firstName: contact.attributes.FIRSTNAME,
                    lastName: contact.attributes.LASTNAME,
                    attributes: contact.attributes,
                    listIds: contact.listIds.map(String) // Convert number list IDs to string
                });
            }

            count = data.count;

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }

        return { contacts: contacts, count: count };
    }
    async getFilteredContacts(inLists: string[], notInLists: string[]): Promise<ContactsResult> {
        // First, fetch all contacts that are in the inLists.
        let inListContacts: Contact[] = [];
        for (const listId of inLists) {
            const contacts = await this.getContactsByList(listId);
            inListContacts = inListContacts.concat(contacts);
        }

        // Fetch all contacts that are in the notInLists.
        let notInListContacts: Contact[] = [];
        for (const listId of notInLists) {
            const contacts = await this.getContactsByList(listId);
            notInListContacts = notInListContacts.concat(contacts);
        }

        // Remove any duplicates from both lists.
        inListContacts = inListContacts.filter(contact => !notInListContacts.some(c => c.id[0].id === contact.id[0].id));
        let count = inListContacts.length;

        // Finally, return the contacts that are in the inLists but not in the notInLists.
        return { contacts: inListContacts, count: count };
    }

    async getPipelines(): Promise<Pipeline[]> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let pipelines: Pipeline[] = [];

        try {
            const url = `${this.url}/crm/pipeline/details/all`;
            // Use Fetch API to get the data
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

            const data = await response.json();

            // The data is an array of pipeline objects
            // iterate through the data and create a Pipeline object for each pipeline and add it to the array
            for (let pipeline of data) {
                let stages: Stage[] = [];

                for (let stage of pipeline.stages) {
                    stages.push({
                        id: stage.id,
                        name: stage.name
                    });
                }

                pipelines.push({
                    name: pipeline.pipeline_name,
                    id: pipeline.pipeline,
                    stages: stages
                });
            }

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }

        return pipelines;
    }

    async addContactToList(contact: Contact | Contact[], list: List): Promise<void> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json'
        };

        let emails: string[] = [];

        if (Array.isArray(contact)) {
            for (let c of contact) {
                emails.push(c.email);
            }
        }
        else {
            emails.push(contact.email);
        }

        const data = JSON.stringify({
            "emails": emails
        });

        try {
            const response = await fetch(`${this.url}/contacts/lists/${list.id}/contacts/add`, {
                method: 'POST',
                headers: headers,
                body: data
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

        }
        catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }
    }
}

export { BrevoAPI };