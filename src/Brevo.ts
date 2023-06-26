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
    async createDeal(name: string, user?: User, attributes?: { [key: string]: string }): Promise<Deal> {
        await this.delayIfNeeded();

        const headers = {
            'api-key': this.apiKey
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

            if (user) {
                // Get class name
                const className = this.constructor.name;

                let brevoId = user.id.find(id => id.crm == className);

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
    getUser(id: string): Promise<User> {
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
    async getUsersByList(listId: string): Promise<User[]> {
        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let users: User[] = [];
        let count = 0;

        do {
            await this.delayIfNeeded();
            try {
                const url = `${this.url}/contacts/lists/${listId}/contacts?limit=50&offset=${users.length == 0 ? 0 : users.length - 1}&sort=desc`;

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
                // iterate through the data and create a User object for each user and add it to the array
                for (let user of data.contacts) {

                    let attributes: { [key: string]: string } = {};

                    // loop through user attributes adding them to the attributes object - except keys "FIRSTNAME" and "LASTNAME"
                    for (let key in user.attributes) {
                        if (key != "FIRSTNAME" && key != "LASTNAME") {
                            attributes[key] = user.attributes[key];
                        }
                    }

                    // Get class name
                    const className = this.constructor.name;

                    users.push({
                        email: user.email,
                        id: [{ id: user.id, crm: className }], // Assuming the CRM name is 'Brevo'
                        firstName: user.attributes.FIRSTNAME,
                        lastName: user.attributes.LASTNAME,
                        attributes: user.attributes,
                        listIds: user.listIds.map(String) // Convert number list IDs to string
                    });
                }

                count = data.count;

            } catch (error) {
                console.error('Error:', error);
                throw new Error('Error:' + error);
            }
        } while (users.length < count);

        return users;
    }
    async getUsers(limit: number, offset: number): Promise<UsersResult> {
        await this.delayIfNeeded();

        const headers = {
            'Accept': 'application/json',
            'api-key': this.apiKey
        };

        let users: User[] = [];
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
            // iterate through the data and create a User object for each user and add it to the array
            for (let user of data.contacts) {

                let attributes: { [key: string]: string } = {};

                // loop through user attributes adding them to the attributes object - except keys "FIRSTNAME" and "LASTNAME"
                for (let key in user.attributes) {
                    if (key != "FIRSTNAME" && key != "LASTNAME") {
                        attributes[key] = user.attributes[key];
                    }
                }

                // Get class name
                const className = this.constructor.name;

                users.push({
                    email: user.email,
                    id: [{ id: user.id, crm: className }], // Assuming the CRM name is 'Brevo'
                    firstName: user.attributes.FIRSTNAME,
                    lastName: user.attributes.LASTNAME,
                    attributes: user.attributes,
                    listIds: user.listIds.map(String) // Convert number list IDs to string
                });
            }

            count = data.count;

        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error:' + error);
        }

        return { users: users, count: count };
    }
}

export { BrevoAPI };