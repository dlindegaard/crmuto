import { BrevoAPI } from './Brevo';

type ActionType = "notLoading" | "timerSet" | "loading";

export const app = {
    brevo: null as BrevoAPI | null,
    init: async function () {
        const storedApiKey = localStorage.getItem('apiKey');
        if (storedApiKey) {
            this.apiKey = storedApiKey;
            try {
                this.brevo = new BrevoAPI(this.apiKey, 'http://localhost:5000');
                await this.brevo.getContacts(1, 0);
                this.setActiveView('contacts-view');
            } catch (error) {
                this.brevo = null;
                this.setActiveView('api-key-view');
            }
        } else {
            this.setActiveView('api-key-view');
        }
    },
    //#region Loading  
    _isLoading: 'notLoading' as ActionType,
    _loadingTimeout: -1,
    get isLoading() {
        return this._isLoading === 'loading';
    },
    set isLoading(value: boolean) {
        if (value && this._isLoading !== 'loading') {
            if (this._loadingTimeout === -1) {
                this._isLoading = 'timerSet';
                this._loadingTimeout = window.setTimeout(() => {
                    this._isLoading = 'loading';
                }, 500);
            }
        } else if (!value) {
            this._isLoading = 'notLoading';
            if (this._loadingTimeout !== -1) {
                window.clearTimeout(this._loadingTimeout);
                this._loadingTimeout = -1;
            }
        }
    },
    //#endregion
    //#region Api-key
    apiKey: '',
    setApiKey: async function () {
        localStorage.setItem('apiKey', this.apiKey);
        try {
            this.brevo = new BrevoAPI(this.apiKey, 'http://localhost:5000');
            await this.brevo.getContacts(1, 0);
            alert("Valid API key");
        } catch (error) {
            this.brevo = null;
            alert("Invalid API key");
        }

    },
    unsetApiKey: function () {
        localStorage.setItem('apiKey', '');
        this.apiKey = '';
        this.lists = [];
        this.contacts = [];
    },
    //#endregion    
    //#region View control
    activeView: 'no-view',
    setActiveView(view: string) {
        this.activeView = view;
        if (view === 'contacts-view') {
            this.fetchContacts();
        }
        if (view === 'lists-view') {
            this.fetchLists();
        }
    },
    //#endregion
    //#region Contacts 
    contacts: [] as Contact[],
    contactsPerPage: 30,
    currentPage: 0,
    totalPages: 0,
    async fetchContacts(page: number = 0) {
        this.isLoading = true;
        const offset = page * this.contactsPerPage;
        const contactsResult = await this.brevo?.getContacts(this.contactsPerPage, offset);
        if (contactsResult) {
            this.contacts = contactsResult.contacts;
            this.totalPages = Math.ceil(contactsResult.count / this.contactsPerPage);
        }
        this.isLoading = false;
    },
    async nextContacts() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            await this.fetchContacts(this.currentPage);
        }
    },
    async prevContacts() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await this.fetchContacts(this.currentPage);
        }
    },
    //#endregion
    //#region Lists
    lists: [] as List[],
    async fetchLists() {
        this.isLoading = true;
        try {
            if (this.brevo !== null)
                this.lists = await this.brevo?.getLists();
        } catch (error) {
            alert("Error fetching lists");
        }
        this.isLoading = false;
    },
    async createDealsForList(listId: string) {
        try {
            this.isLoading = true;
            // Fetch contacts in the list
            const contacts = await this.brevo?.getContactsByList(listId);
            // Create a deal for each contact
            if (contacts) {
                for (const contact of contacts) {
                    // Note: you need to provide a deal name and additional deal attributes here
                    await this.brevo?.createDeal("Automated deal", contact);
                }
            }
            this.isLoading = false;
            alert('Deals created successfully');
        } catch (error) {
            alert('Error creating deals');
        }
    }
    //#endregion    
};