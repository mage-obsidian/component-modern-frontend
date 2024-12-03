import { Command } from 'commander';
import { execSync } from 'child_process';
import configResolver from '#service/configResolver.cjs';

const program = new Command();

program
    .option('--theme <theme>', 'Specify the active theme')
    .option('--dev-server', 'Run the development server for a specific theme');

program.parse(process.argv);

const options = program.opts();
const themesConfig = configResolver.getMagentoConfig().themes;

// Validar opciones
if (options.devServer && !options.theme) {
    console.error('The --theme option is required when using --dev-server.');
    process.exit(1);
}

const theme = options.theme || 'all';

const executeCommand = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Command failed: ${command}`, error);
        process.exit(1);
    }
};

const buildTheme = (themeName) => {
    console.log(`Building theme: ${themeName}`);
    try {
        const theme = themesConfig[themeName];
        if (!theme) {
            console.error(`Theme "${themeName}" does not exist.`);
            process.exit(1);
        }

        process.env.CURRENT_THEME = themeName;
        executeCommand('vite build');
    } catch (error) {
        console.error(`Failed to build theme "${themeName}":`, error);
    }
};

const runDevServer = (themeName) => {
    console.log(`Starting development server for theme: ${themeName}`);
    try {
        const theme = themesConfig[themeName];
        if (!theme) {
            console.error(`Theme "${themeName}" does not exist.`);
            process.exit(1);
        }

        process.env.CURRENT_THEME = themeName;
        executeCommand('vite');
    } catch (error) {
        console.error(`Failed to start development server for theme "${themeName}":`, error);
    }
};

if (options.devServer) {
    runDevServer(theme);
} else {
    if (theme === 'all') {
        for (const themeName of Object.keys(themesConfig)) {
            buildTheme(themeName);
        }
    } else if (themesConfig[theme]) {
        buildTheme(theme);
    } else {
        console.error(`Theme "${theme}" does not exist.`);
        process.exit(1);
    }
}
