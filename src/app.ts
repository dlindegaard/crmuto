import { BrevoAPI } from './Brevo';

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
    _isLoading: 'notLoading' as "notLoading" | "timerSet" | "loading",
    _loadingTimeout: -1,
    loadingText: '',
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
            this.loadingText = '';
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
            this.alert.show("Valid API key");
        } catch (error) {
            this.brevo = null;
            this.alert.show("Invalid API key");
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
    contactsViewState: 'normal' as 'normal' | 'filtering',
    async fetchContacts(page: number = 0) {
        this.isLoading = true;
        this.loadingText = 'Fetching contacts';
        const offset = page * this.contactsPerPage;
        let contactsResult;
        if (this.activeFilters.length > 0) {
            this.loadingText = 'Filtering contacts. This may take a while.';
            const inLists = this.activeFilters.filter(filter => filter.type === 'in').map(filter => filter.id);
            const notInLists = this.activeFilters.filter(filter => filter.type === 'notIn').map(filter => filter.id);
            contactsResult = await this.brevo?.getFilteredContacts(inLists, notInLists);
        } else {
            contactsResult = await this.brevo?.getContacts(this.contactsPerPage, offset);
        }
        if (contactsResult) {
            this.contacts = contactsResult.contacts;
            this.totalPages = Math.ceil(contactsResult.count / Math.max(this.contactsPerPage, this.contacts.length));
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
    async createDealsForAllContacts() {
        //const confirmation = confirm(`Are you sure you want to create deals?`);
        const confirmation = await this.confirm.show("Are you sure you want to create deals?");
        if (confirmation == false) {
            this.alert.show("Creation of deals cancelled");
            return;
        }

        try {
            this.isLoading = true;
            this.loadingText = 'Creating deals';

            let allContacts = [...this.contacts];
            if (this.totalPages > 1) {
                for (let page = 1; page < this.totalPages; page++) {
                    this.loadingText = `Creating deals for page ${page + 1} of ${this.totalPages}`;
                    const contactsResult = await this.brevo?.getContacts(this.contactsPerPage, page * this.contactsPerPage);
                    if (contactsResult && contactsResult.contacts) {
                        allContacts = [...allContacts, ...contactsResult.contacts];
                    }
                }
            }

            // Create a deal for each contact
            let numberOfDealsCreated = 1;
            for (const contact of allContacts) {
                this.loadingText = `Creating deal ${numberOfDealsCreated++} of ${allContacts.length}`;
                await this.brevo?.createDeal("Automated deal", contact);
            }

            this.isLoading = false;
            this.alert.show('Deals created successfully');
        } catch (error) {
            this.alert.show('Error creating deals');
        }
    },
    //#region Filtering
    activeFilters: [] as Array<{ id: string, name: string, type: 'in' | 'notIn' }>,
    selectedFilter: '',
    editFilters: [] as Array<{ id: string, name: string, type: 'in' | 'notIn' }>,
    filterChangeTracker: 0,
    get changesToFilters() {
        // check if there are any changes to the filters
        if (this.activeFilters.length !== this.editFilters.length) {
            return true;
        }
        for (let i = 0; i < this.activeFilters.length; i++) {
            const activeFilter = this.activeFilters[i];
            const editFilter = this.editFilters[i];
            if (activeFilter.id != editFilter.id || activeFilter.type != editFilter.type) {
                return true;
            }
        }
        return false;
    },
    addFilter: function () {
        const list = this.lists.find(list => list.id == this.selectedFilter);
        if (list) {
            this.editFilters.push({ id: list.id, name: list.name, type: 'in' });
        }
    },
    applyFilters: function () {
        // duplicate the filters
        this.activeFilters = this.editFilters.map(filter => ({ ...filter }));
        this.fetchContacts();
    },
    removeFilter: function (index: number) {
        this.editFilters.splice(index, 1);
    },
    initContactsFiltering: function () {
        this.fetchLists();
        this.contactsViewState = 'filtering';
    },
    cancelContactsFiltering: function () {
        this.contactsViewState = 'normal';
        this.editFilters = [];
        this.activeFilters = [];
        this.fetchContacts();
    },
    //#endregion
    //#endregion
    //#region Lists
    lists: [] as List[],
    async fetchLists() {
        this.isLoading = true;
        this.loadingText = 'Fetching lists';
        try {
            if (this.brevo !== null)
                this.lists = await this.brevo?.getLists();
        } catch (error) {
            this.alert.show("Error fetching lists");
        }
        this.isLoading = false;
    },
    seeContactsOfList: function (id: string, name: string) {
        this.initContactsFiltering();
        this.editFilters.push({ id: id, name: name, type: 'in' });
        this.activeView = 'contacts-view';
        this.applyFilters(); // Apply the filters and fetch the contacts
    },
    //#endregion        
    //#region Custom alert and confirm
    alert: {
        visible: false,
        message: '',
        show(message : string) {
            this.message = message;
            this.visible = true;
        }
    },

    confirm: {
        visible: false,
        message: '',
        resolve: null as Function | null,
        show(message : string) {
            return new Promise((resolve) => {
                this.message = message;
                this.visible = true;
                this.resolve = (value : boolean) => {
                    this.visible = false;
                    resolve(value);
                };
            });
        }
    },
    //#endregion
};