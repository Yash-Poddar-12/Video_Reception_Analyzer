// ==============================================================================
// utils/rRunner.js - R Script Execution Utility
// ==============================================================================

const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');

/**
 * Execute an R script and return the result
 * @param {string} scriptName - Name of the R script (e.g., 'api_fetch.R')
 * @param {string[]} args - Command line arguments to pass
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<object>} - Parsed JSON output from R script
 */
function runRScript(scriptName, args = [], timeout = config.rScriptTimeout) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(config.rScriptsPath, scriptName);
        const startTime = Date.now();
        
        console.log(`[R Runner] Executing: ${scriptPath} ${args.join(' ')}`);
        
        // Capture globals before spawn to avoid any shadowing issues
        const nodeEnv = process.env;

        // Spawn R process directly (shell: false avoids cmd.exe mangling paths with spaces on Windows)
        // Direct spawn works correctly on Windows when using Rscript.exe or Rscript on PATH.
        const rProcess = spawn(config.rExecutable, [scriptPath, ...args], {
            cwd: path.resolve(__dirname, '../..'),  // Project root
            env: { ...nodeEnv },
            shell: false  // Do NOT use shell: true on Windows - causes ACCESS_VIOLATION (0xC0000005) when paths have spaces
        });
        
        let stdout = '';
        let stderr = '';
        
        // Collect stdout (JSON output)
        rProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        // Collect stderr (logging/progress)
        rProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`[R] ${data.toString().trim()}`);
        });
        
        // Handle timeout
        const timeoutId = setTimeout(() => {
            rProcess.kill('SIGTERM');
            reject(new Error(`R script timed out after ${timeout}ms`));
        }, timeout);
        
        // Handle completion
        rProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            console.log(`[R Runner] Script completed in ${duration}ms with code ${code}`);
            
            if (code !== 0) {
                reject(new Error(`R script exited with code ${code}: ${stderr}`));
                return;
            }
            
            // Parse JSON output
            try {
                // Remove any pre-json output that might have gotten into stdout instead of stderr
                const jsonStr = stdout.substring(stdout.indexOf('{'));
                const result = JSON.parse(jsonStr);
                resolve(result);
            } catch (parseError) {
                reject(new Error(`Failed to parse R output: ${stdout}`));
            }
        });
        
        // Handle errors
        rProcess.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start R script: ${err.message}`));
        });
    });
}

module.exports = { runRScript };
