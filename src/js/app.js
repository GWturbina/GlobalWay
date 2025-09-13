const App = {
    async init() {
        console.log('App: Starting initialization...');
        
        try {
            await UI.init();
            console.log('App: Initialization complete');
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
