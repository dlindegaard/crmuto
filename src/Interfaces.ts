// All of the interfaces used in the project are based on the Brevo/SendInBlue API documentation
interface CrmAPI {
    getContact(id: string): Promise<Contact>;
    getLists(): Promise<List[]>;
    getList(id: string): Promise<List>;
    getContactsByList(listId: string): Promise<Contact[]>;
    getContacts(limit: number, offset: number): Promise<ContactsResult>;
    createDeal(deal: string): Promise<Deal>;
    getDeal(id: string): Promise<Deal>;
}

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