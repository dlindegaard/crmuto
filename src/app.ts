import { BrevoAPI } from './Brevo';
import './Interfaces';

export const app = {
    apis: [{ name: "Brevo", _constructor: BrevoAPI }] as CrmAPIInfo[],
    apiName: "" as string,
    apiInstance: null as CrmAPI | null,
    init: async function () {

        const storedApiKey = localStorage.getItem('apiKey');
        const storedApiName = localStorage.getItem('apiName');

        if (storedApiKey && storedApiName) {
            this.apiKey = storedApiKey;
            this.apiName = storedApiName;

            try {
                let _constructor = this.apis.find(api => api.name === storedApiName)?._constructor;
                if (_constructor) {
                    this.apiInstance = new _constructor(this.apiKey, 'http://localhost:5000');
                    await this.apiInstance.getContacts(1, 0);
                    this.setActiveView('contacts-view');
                } else {
                    this.apiInstance = null;
                    this.setActiveView('api-key-view');
                }
            } catch (error) {
                this.apiInstance = null;
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
    setupApi: async function () {
        localStorage.setItem('apiKey', this.apiKey);
        localStorage.setItem('apiName', this.apiName);
        try {
            let _constructor = this.apis.find(api => api.name === this.apiName)?._constructor;
            if (_constructor) {
                this.apiInstance = new _constructor(this.apiKey, 'http://localhost:5000');
                await this.apiInstance.getContacts(1, 0);
                this.alert.show("Valid API key");
            } else {
                this.alert.show("No constructor found for this API");
            }
        } catch (error) {
            this.apiInstance = null;
            this.alert.show("Invalid API key");
        }

    },
    disconnectApi: async function () {
        const confirmation = await this.confirm.show('Are you sure you want to disconnect the API?');

        if (!confirmation) {
            return;
        }

        localStorage.setItem('apiKey', '');
        localStorage.setItem('apiName', '');
        this.apiKey = '';
        this.apiName = '';
        this.apiInstance = null;
        this.lists = [];
        this.contacts = [];
        this.pipelines = [];

        this.alert.show("API disconnected");
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
        if (view === 'pipelines-view') {
            this.fetchPipelines();
        }
    },
    //#endregion
    //#region Contacts 
    contacts: [] as Contact[],
    contactsPerPage: 30,
    currentPage: 0,
    totalPages: 0,
    totalNumberOfContacts: 0,
    contactsViewState: 'normal' as 'normal' | 'filtering',
    async fetchContacts(page: number = 0) {
        this.isLoading = true;
        this.loadingText = 'Fetching contacts';
        const offset = page * this.contactsPerPage;
        let contactsResult;
        if (this.activeListFilters.length > 0) {
            this.loadingText = 'Filtering contacts. This may take a while.';
            const inLists = this.activeListFilters.filter(filter => filter.type === 'in').map(filter => filter.id);
            const notInLists = this.activeListFilters.filter(filter => filter.type === 'notIn').map(filter => filter.id);
            contactsResult = await this.apiInstance?.getFilteredContacts(inLists, notInLists);
        } else {
            contactsResult = await this.apiInstance?.getContacts(this.contactsPerPage, offset);
        }
        if (contactsResult) {
            this.contacts = contactsResult.contacts;
            this.totalNumberOfContacts = contactsResult.count;
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
    dealCreationModalVisible: false,
    dealPipelineId: "" as string,
    dealStageId: "" as string,
    openDealCreationModal() {
        this.fetchPipelines();
        this.dealPipelineId = "";
        this.dealStageId = "";
        this.dealCreationModalVisible = true;
    },
    async createDealsForAllContacts() {
        if (this.dealPipelineId == "" || this.dealStageId == "") {
            this.alert.show("Deal creation failed. Please select a pipeline and stage.");
            return;
        }

        try {
            this.isLoading = true;
            this.loadingText = 'Creating deals';

            if (this.totalPages > 1) {
                let allContacts = [...this.contacts];

                for (let page = 1; page < this.totalPages; page++) {
                    this.loadingText = `Creating deals for page ${page + 1} of ${this.totalPages}`;
                    const contactsResult = await this.apiInstance?.getContacts(this.contactsPerPage, page * this.contactsPerPage);
                    if (contactsResult && contactsResult.contacts) {
                        allContacts = [...allContacts, ...contactsResult.contacts];
                    }
                }
            }

            // Create a deal for each contact
            let numberOfDealsCreated = 1;
            for (const contact of this.contacts) {
                this.loadingText = `Creating deal ${numberOfDealsCreated++} of ${this.contacts.length}`;
                let nameOfDeal = "New deal";
                if(contact.firstName) {
                    nameOfDeal = contact.firstName + " ";
                }
                if(contact.lastName) {
                    nameOfDeal += contact.lastName;
                }            
                // remove spaces after the name
                nameOfDeal = nameOfDeal.trim();
                await this.apiInstance?.createDeal(nameOfDeal, contact, { pipeline: this.dealPipelineId, deal_stage: this.dealStageId });
            }

            this.isLoading = false;
            this.alert.show('Deals created successfully');
        } catch (error) {
            this.alert.show('Error creating deals');
        }
    },
    addContactsToListModalVisible: false,
    listId: "" as string,    
    openAddContactsToListModal() {        
        this.addContactsToListModalVisible = true;
    },
    addContactsToList: async function () {
        if (this.listId == "") {
            this.alert.show("Please select a list");
            return;
        }
        let list = this.lists.find(list => list.id == this.listId);
        if (!list) {
            this.alert.show("Please select a valid list");
            return;
        }

        try {
            this.isLoading = true;
            this.loadingText = 'Adding contacts to list';            
            await this.apiInstance?.addContactToList(this.contacts, list);
            this.isLoading = false;
            this.alert.show('Contacts added to list successfully');
        } catch (error) {
            this.alert.show('Error adding contacts to list');
        }
    },
    get uniqueAttributes(): string[] {
        let attributes: string[] = [];
        for (const contact of this.contacts) {
            for (const attribute in contact.attributes) {
                if (!attributes.includes(attribute)) {
                    attributes.push(attribute);
                }
            }
        }
        return attributes;
    },    
    //#region Filtering
    initContactsFiltering: function () {
        this.fetchLists();
        this.contactsViewState = 'filtering';
    },
    cancelContactsFiltering: function () {
        this.contactsViewState = 'normal';
        this.editListFilters = [];
        this.activeListFilters = [];
        this.fetchContacts();
    },
    applyContactsFilters: async function () {
        // duplicate the filters
        this.activeListFilters = this.editListFilters.map(filter => ({ ...filter }));
        this.activeAttributeFilters = this.editAttributeFilters.map(filter => ({ ...filter }));
        await this.fetchContacts();
        this.isLoading = true;
        this.loadingText = 'Filtering contacts by attributes';
        this.filterContactsByAttributes();
        this.isLoading = false;

    },
    get changesToFilters() {
        // check if there are any changes to the filters
        if (this.activeListFilters.length !== this.editListFilters.length) {
            return true;
        }
        for (let i = 0; i < this.activeListFilters.length; i++) {
            const activeFilter = this.activeListFilters[i];
            const editFilter = this.editListFilters[i];
            if (activeFilter.id != editFilter.id || activeFilter.type != editFilter.type) {
                return true;
            }
        }
        // check if there are any changes to attribute filters
        if (this.activeAttributeFilters.length !== this.editAttributeFilters.length) {
            return true;
        }
        for (let i = 0; i < this.activeAttributeFilters.length; i++) {
            const activeFilter = this.activeAttributeFilters[i];
            const editFilter = this.editAttributeFilters[i];
            if (activeFilter.attribute != editFilter.attribute || activeFilter.type != editFilter.type || activeFilter.value != editFilter.value) {
                return true;
            }
        }
        return false;
    },
    //#region List filtering    
    selectedFilter: '',
    activeListFilters: [] as Array<{ id: string, name: string, type: 'in' | 'notIn' }>,
    editListFilters: [] as Array<{ id: string, name: string, type: 'in' | 'notIn' }>,
    filterChangeTracker: 0,
    addListFilter: function () {
        const list = this.lists.find(list => list.id == this.selectedFilter);
        if (list) {
            this.editListFilters.push({ id: list.id, name: list.name, type: 'in' });
        }
    },
    removeListFilter: function (index: number) {
        this.editListFilters.splice(index, 1);
    },
    //#endregion
    //#region Attribute filtering
    selectedAttribute: "" as string,
    editAttributeFilters: [] as Array<{ attribute: string, type: 'contains' | 'null' | 'exists' | 'not empty', value: string }>,
    activeAttributeFilters: [] as Array<{ attribute: string, type: 'contains' | 'null' | 'exists' | 'not empty', value: string }>,
    addAttributeToFilter: function () {
        this.editAttributeFilters.push({ attribute: this.selectedAttribute, type: 'contains', value: '' });
    },
    removeAttributeFilter: function (index: number) {
        this.editAttributeFilters.splice(index, 1);
    },
    filterContactsByAttributes: function () {
        let filteredContacts = [];
        for (const contact of this.contacts) {
            let contactMatchesFilters = true;
            for (const filter of this.activeAttributeFilters) {
                switch (filter.type) {
                    case 'contains':
                        if (contact.attributes[filter.attribute] == undefined || !contact.attributes[filter.attribute].includes(filter.value)) {
                            contactMatchesFilters = false;
                        }
                        break;
                    case 'null':
                        if (contact.attributes[filter.attribute] != null) {
                            contactMatchesFilters = false;
                        }
                        break;
                    case 'exists':
                        if (contact.attributes[filter.attribute] == null) {
                            contactMatchesFilters = false;
                        }
                        break;      
                    case 'not empty':
                        // Not null, not empty string, not string with only spaces
                        if (contact.attributes[filter.attribute] == null || contact.attributes[filter.attribute].trim() == "") {
                            contactMatchesFilters = false;
                        }
                        break;                  
                }
            }
            if (contactMatchesFilters) {
                filteredContacts.push(contact);
            }
        }
        this.contacts = filteredContacts;
        this.totalNumberOfContacts = filteredContacts.length;
    },
    //#endregion
    //#endregion
    //#endregion
    //#region Lists
    lists: [] as List[],
    async fetchLists() {
        this.isLoading = true;
        this.loadingText = 'Fetching lists';
        try {
            if (this.apiInstance !== null)
                this.lists = await this.apiInstance?.getLists();
        } catch (error) {
            this.alert.show("Error fetching lists");
        }
        this.isLoading = false;
    },
    seeContactsOfList: function (id: string, name: string) {
        this.initContactsFiltering();
        this.editListFilters.push({ id: id, name: name, type: 'in' });
        this.activeView = 'contacts-view';
        this.applyContactsFilters(); // Apply the filters and fetch the contacts
    },
    //#endregion        
    //#region Pipelines
    pipelines: [] as Pipeline[],
    async fetchPipelines() {
        this.isLoading = true;
        this.loadingText = 'Fetching pipelines';
        try {
            if (this.apiInstance !== null)
                this.pipelines = await this.apiInstance?.getPipelines();
        } catch (error) {
            this.alert.show("Error fetching pipelines");
        }
        this.isLoading = false;
    },
    //#endregion
    //#region Custom alert and confirm
    alert: {
        visible: false,
        message: '',
        show(message: string) {
            this.message = message;
            this.visible = true;
        }
    },

    confirm: {
        visible: false,
        message: '',
        resolve: null as Function | null,
        show(message: string) {
            return new Promise((resolve) => {
                this.message = message;
                this.visible = true;
                this.resolve = (value: boolean) => {
                    this.visible = false;
                    resolve(value);
                };
            });
        }
    },
    //#endregion
};