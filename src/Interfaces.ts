// All of the interfaces used in the project are based on the Brevo/SendInBlue API documentation
interface CrmAPI {
    getUser(id: string): Promise<User>;
    getLists(): Promise<List[]>;
    getList(id: string): Promise<List>;
    getUsersByList(listId: string): Promise<User[]>;
    getUsers(limit: number, offset: number): Promise<UsersResult>;
    createDeal(deal: string): Promise<Deal>;
    getDeal(id: string): Promise<Deal>;
}

interface User {
    email: string;
    id: Id[];
    firstName: string;
    lastName: string;
    attributes: { [key: string]: string };
    listIds: string[];
}

interface UsersResult {
    users: User[];
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