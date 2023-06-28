// All of the interfaces used in the project are based on the Brevo/SendInBlue API documentation
interface CrmAPI {
    getContact(id: string): Promise<Contact>;
    getLists(): Promise<List[]>;
    getList(id: string): Promise<List>;
    getContactsByList(listId: string): Promise<Contact[]>;
    getContacts(limit: number, offset: number): Promise<ContactsResult>;
    getFilteredContacts(inLists: string[], notInLists: string[]) : Promise<ContactsResult>;
    createDeal(name: string, contact?: Contact, attributes?: { [key: string]: string }): Promise<Deal>;
    getDeal(id: string): Promise<Deal>;
    getPipelines(): Promise<Pipeline[]>;
}

type CrmAPIInfo = { name: string, _constructor: { new(apiKey: string, proxyUrl: string): CrmAPI; } };

interface Contact {
    email: string;
    id: Id[];
    firstName: string;
    lastName: string;
    attributes: { [key: string]: string };
    listIds: string[];
}

interface ContactsResult {
    contacts: Contact[];
    count: number;
}

interface Id {
    id: number;
    crm: string;
}

interface List {
    id: string;
    name: string;
    folderId: string;
    meta: { [key: string]: string };
}

interface Deal {
    id: string;
    attributes: { [key: string]: string };
}

interface Stage {
    id: string;
    name: string;
}

interface Pipeline {
    name: string;
    id: string;
    stages: Stage[];
}
