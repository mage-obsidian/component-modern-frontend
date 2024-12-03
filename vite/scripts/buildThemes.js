import { Command } from 'commander';
import { execSync } from 'child_process';
import readlineSync from 'readline-sync';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import configResolver from '#service/configResolver.cjs';
import dotenv from 'dotenv';
dotenv.config();

const program = new Command();

program
    .option('--theme <theme>', 'Specify the active theme')
    .option('--dev-server', 'Run the development server for a specific theme');

program.parse(process.argv);

const options = program.opts();
const themesConfig = configResolver.getMagentoConfig().themes;

if (options.devServer && !options.theme) {
    console.error(chalk.red('Error: The --theme option is required when using --dev-server.'));
    process.exit(1);
}

const theme = options.theme || 'all';

const executeCommand = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(chalk.red(`Command failed: ${command}`), error);
        process.exit(1);
    }
};

function tryCreateEnvFile() {
    const defaultEnvVars = {
        VITE_SERVER_HOST: 'phpfpm',
        VITE_SERVER_PORT: '5173',
        VITE_SERVER_SECURE: 'true',
        VITE_HMR_PATH: '/__vite_ping',
        MAGENTO_HOST: 'magento.test',
    };

    console.log(chalk.blue('Creating `.env` file with default or user-provided values...'));

    const envFilePath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFilePath)) {
        console.log(chalk.green('.env file already exists.'));
        return;
    }

    let envContent = '';
    for (const [key, defaultValue] of Object.entries(defaultEnvVars)) {
        const userInput = readlineSync.question(chalk.yellow(`Enter value for ${key} (default: ${defaultValue}): `), {
            defaultInput: defaultValue,
        });
        envContent += `${key}=${userInput || defaultValue}\n`;
    }

    fs.writeFileSync(envFilePath, envContent);
    console.log(chalk.green('.env file created successfully.'));
}

function validateEnv() {
    const requiredEnvVars = ['VITE_SERVER_HOST', 'VITE_SERVER_PORT', 'VITE_SERVER_SECURE', 'VITE_HMR_PATH', 'MAGENTO_HOST'];
    let missingEnvVars = [];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingEnvVars.push(envVar);
        }
    }
    if (missingEnvVars.length > 0) {
        console.error(chalk.red(`Missing required environment variables: ${missingEnvVars.join(', ')}`));
        tryCreateEnvFile();
        console.log(chalk.green('Please restart the script after setting up the .env file.'));
        process.exit(1);
    }
}

const buildTheme = (themeName) => {
    console.log(chalk.cyan(`Building theme: ${themeName}`));
    try {
        const theme = themesConfig[themeName];
        if (!theme) {
            console.error(chalk.red(`Theme "${themeName}" does not exist.`));
            process.exit(1);
        }

        process.env.CURRENT_THEME = themeName;
        executeCommand('vite build');
    } catch (error) {
        console.error(chalk.red(`Failed to build theme "${themeName}":`), error);
    }
};

const runDevServer = (themeName) => {
    console.log(chalk.cyan(`Starting development server for theme: ${themeName}`));
    try {
        const theme = themesConfig[themeName];
        if (!theme) {
            console.error(chalk.red(`Theme "${themeName}" does not exist.`));
            process.exit(1);
        }

        process.env.CURRENT_THEME = themeName;
        executeCommand('vite');
    } catch (error) {
        console.error(chalk.red(`Failed to start development server for theme "${themeName}":`), error);
    }
};

validateEnv();

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
        console.error(chalk.red(`Theme "${theme}" does not exist.`));
        process.exit(1);
    }
}
