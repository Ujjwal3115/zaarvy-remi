import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

// Utility to check Ollama models
async function getOllamaModels() {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (!res.ok) return [];
    const data = await res.json();
    return data.models.map(m => m.name);
  } catch (e) {
    return [];
  }
}

export async function setupCommand() {
  console.log(chalk.blue.bold('\nWelcome to REMI Setup!\n'));

  let answers = {};
  let step = 0;

  while (step < 5) {
    switch (step) {
      case 0: {
        const { dbType } = await inquirer.prompt([
          {
            type: 'select',
            name: 'dbType',
            message: 'Where do you want to store your project memory?',
            choices: [
              { name: 'Local (SQLite - stored on this machine)', value: 'local' },
              { name: 'Cloud (Supabase - sync across devices)', value: 'supabase' }
            ]
          }
        ]);
        answers.dbType = dbType;
        step = (dbType === 'supabase') ? 1 : 2;
        break;
      }

      case 1: {
        const res = await inquirer.prompt([
          {
            type: 'input',
            name: 'supabaseUrl',
            message: 'Enter your Supabase Project URL (or type "back" to return):',
          },
          {
            type: 'input',
            name: 'supabaseKey',
            message: 'Enter your Supabase Anon Key:',
            when: (ans) => ans.supabaseUrl.toLowerCase() !== 'back'
          }
        ]);
        
        if (res.supabaseUrl.toLowerCase() === 'back') {
          step = 0;
        } else {
          answers.supabaseUrl = res.supabaseUrl;
          answers.supabaseKey = res.supabaseKey;
          step = 2;
        }
        break;
      }

      case 2: {
        const { aiMode } = await inquirer.prompt([
          {
            type: 'select',
            name: 'aiMode',
            message: 'Select your preferred NLP AI Mode:',
            choices: [
              { name: 'Strict Mode Only (No NLP, flag-based only)', value: 'strict' },
              { name: 'Cloud API', value: 'cloud' },
              { name: 'Local Model (via Ollama)', value: 'local' },
              { name: '<- Back', value: 'back' }
            ]
          }
        ]);

        if (aiMode === 'back') {
          step = (answers.dbType === 'supabase') ? 1 : 0;
        } else if (aiMode === 'strict') {
          answers.aiMode = 'strict';
          step = 5; // End
        } else {
          answers.aiMode = aiMode;
          step = 3;
        }
        break;
      }

      case 3: {
        if (answers.aiMode === 'cloud') {
          const { cloudProvider } = await inquirer.prompt([
            {
              type: 'select',
              name: 'cloudProvider',
              message: 'Select your Cloud AI Provider:',
              choices: [
                { name: 'OpenAI', value: 'openai' },
                { name: 'Google (Gemini)', value: 'gemini' },
                { name: 'Groq', value: 'groq' },
                { name: 'Anthropic', value: 'anthropic' },
                { name: '<- Back', value: 'back' }
              ]
            }
          ]);
          if (cloudProvider === 'back') {
            step = 2;
          } else {
            answers.aiProvider = cloudProvider;
            step = 4;
          }
        } else if (answers.aiMode === 'local') {
          console.log(chalk.gray('Checking local Ollama instance for models...'));
          const models = await getOllamaModels();
          
          if (models.length === 0) {
            console.log(chalk.red('\n[Warning] No local models found or Ollama is offline.'));
            console.log(chalk.yellow('Please download a model (e.g., "ollama run llama3") or select a different AI Mode.'));
            const { action } = await inquirer.prompt([{
              type: 'select',
              name: 'action',
              message: 'Press Enter to go back:',
              choices: [
                { name: '<- Go Back', value: 'back' }
              ]
            }]);
            
            step = 2;
          } else {
            const modelChoices = models.map(m => ({ name: m, value: m }));
            
            // Ensure llama3 is always available as a minimum default if not fetched natively
            if (!models.includes('llama3') && !models.includes('llama3:latest')) {
              modelChoices.unshift({ name: 'llama3 (Recommended default - requires download)', value: 'llama3' });
            }

            const { localModel } = await inquirer.prompt([
              {
                type: 'select',
                name: 'localModel',
                message: 'Select a local model:',
                choices: [
                  ...modelChoices,
                  { name: '<- Back', value: 'back' }
                ]
              }
            ]);
            if (localModel === 'back') {
              step = 2;
            } else {
              answers.aiProvider = 'ollama';
              answers.localModel = localModel;
              step = 5; // End
            }
          }
        }
        break;
      }

      case 4: {
        const { apiKey } = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiKey',
            message: `Enter your ${answers.aiProvider} API Key (or type "back" to return):`
          }
        ]);
        
        if (apiKey.toLowerCase() === 'back') {
          step = 3;
        } else {
          answers.apiKey = apiKey;
          step = 5; // End
        }
        break;
      }
    }
  }

  const configPath = path.join(os.homedir(), '.remi');
  const configFile = path.join(configPath, 'config.json');

  try {
    await fs.mkdir(configPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  await fs.writeFile(configFile, JSON.stringify(answers, null, 2));
  console.log(chalk.green.bold(`\nSetup complete! Configuration saved to ${configFile}\n`));
}
