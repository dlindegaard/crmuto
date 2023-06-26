import { BrevoAPI } from './Brevo';

type ActionType = "notLoading" | "timerSet" | "loading";

export const app = {
    activeView: 'no-view',
    _isLoading: 'notLoading' as ActionType,
    apiKey: '',
    brevo: null as BrevoAPI | null,
    users: [] as User[],
    usersPerPage: 30,
    currentPage: 0,
    totalPages: 0,
    lists: [] as List[],
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
    setApiKey: async function () {
        localStorage.setItem('apiKey', this.apiKey);
        try {
            this.brevo = new BrevoAPI(this.apiKey, 'http://localhost:5000');
            await this.brevo.getUsers(1, 0);
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
        this.users = [];
    },
    init: async function () {
        const storedApiKey = localStorage.getItem('apiKey');
        if (storedApiKey) {
            this.apiKey = storedApiKey;
            try {
                this.brevo = new BrevoAPI(this.apiKey, 'http://localhost:5000');
                await this.brevo.getUsers(1, 0);
                this.setActiveView('contacts-view');
            } catch (error) {
                this.brevo = null;
                this.setActiveView('api-key-view');
            }
        } else {
            this.setActiveView('api-key-view');
        }
    },
    setActiveView(view: string) {
        this.activeView = view;
        if (view === 'contacts-view') {
            this.fetchUsers();
        }
        if (view === 'lists-view') {
            this.fetchLists();
        }
    },
    async fetchUsers(page: number = 0) {
        this.isLoading = true;
        const offset = page * this.usersPerPage;
        const usersResult = await this.brevo?.getUsers(this.usersPerPage, offset);
        if (usersResult) {
            this.users = usersResult.users;
            this.totalPages = Math.ceil(usersResult.count / this.usersPerPage);
        }
        this.isLoading = false;
    },
    async nextUsers() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            await this.fetchUsers(this.currentPage);
        }
    },
    async prevUsers() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await this.fetchUsers(this.currentPage);
        }
    },
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
            // Fetch users in the list
            const users = await this.brevo?.getUsersByList(listId);
            // Create a deal for each user
            if (users) {
                for (const user of users) {
                    // Note: you need to provide a deal name and additional deal attributes here
                    await this.brevo?.createDeal("Automated deal", user);
                }
            }
            this.isLoading = false;
            alert('Deals created successfully');
        } catch (error) {
            alert('Error creating deals');
        }
    }
};