const App = {
    async init() {
        console.log('App: Starting initialization...');
        
        try {
            await UI.init();
            
            // ДОБАВИТЬ инициализацию контрактов
            if (window.Web3Module && window.ContractsModule) {
                try {
                    await ContractsModule.init();
                    console.log('Contracts initialized');
                } catch (error) {
                    console.error('Contracts initialization failed:', error);
                }
            }
            
            console.log('App: Initialization complete');
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }
};
