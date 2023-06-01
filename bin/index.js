#! /usr/bin/env node
const yargs = require("yargs")
const fs = require('fs')
const fsx = require('fs-extra')
const path = require('path');
const util = require('util');
const {exec} = require('child_process')
// const exec = util.promisify(require('child_process').exec);


const options = yargs  
    .usage('$0 <cmd> [args]')
    .option("i", {alias:"init", describe: "initialize project.", type: "string" })                                                                                                    
    .help(true)  
    .argv;



const CURRENT_PROJECT_NAME = "VsBoilerPlateV2"
const CURRENT_PACKAGE_NAME = "com.vsboilerplatev2"
if (options.i) {
    const projectName = options.i

    // create path and clone repo
    const REPO_URL = "https://github.com/virtualspirit/VsBoilerPlateV2.git"
    const clone = require('git-clone');
    const targetPath = path.join("./", projectName)
    fs.mkdir(targetPath, (err) => {
        if (err) {
            return console.error(err);
        }
        try {
            clone(REPO_URL, path.join("./", projectName), [], () => {
                removeGit(targetPath)
                modifyPackageJson(targetPath, projectName)
                console.log("completed clone vsboilerplate")
                handleIOSStructure(targetPath, projectName)
                console.log("completed adjust ios project")
                handleAndroidStructure(targetPath, projectName)
                console.log("completed adjust android project")
                installDependencies(targetPath)
            })
        } catch (error) {
         console.log("failed to generate project")   
        }
    });
}


// remove git
function removeGit(targetPath) {
    exec(`cd ${targetPath} && rm -rf .git* `)
}

// run pod install
async function installPod(targetPath) {
    console.log("instal pod")
    const {stdout, stderr} = exec(`cd ${targetPath}/ios && pod install`)
    stdout.on('data', (data) => console.log(data))
    stdout.on('error', (data) => console.log(data))
    stdout.on('end', () => {
        console.log('completed install pod')
    })
}

// install dependencies
async function installDependencies(targetPath) {
    try {
        console.log("installing dependencies")
        const {stdout, stderr} = exec(`cd ${targetPath} && yarn install`)
        stdout.on('data', (data) => console.log(data))
        stdout.on('error', (data) => console.log(data))
        stdout.on('end', () => {
            console.log('completed install dependencies')
            installPod(targetPath)
        })
    } catch (error) {
        console.log('failed install dependencies')
    }
}


// modify package json
function modifyPackageJson(targetPath, projectName) {
    try {
        let value = fs.readFileSync(`${targetPath}/package.json`, {encoding: 'utf-8'})
        value = value.replace(CURRENT_PROJECT_NAME, projectName);
        value = value.replace(`appcenter codepush release-react -a fajar-virtualspirit.me/VsBoilerPlate-Android -d Production --sourcemap-output --output-dir ./build`, `appcenter codepush release-react -a [put_your_android_production_codepush_id_here] -d Production --sourcemap-output --output-dir ./build`);
        value = value.replace(`appcenter codepush release-react -a fajar-virtualspirit.me/VsBoilerPlate-Android -d Staging --sourcemap-output --output-dir ./build`, `appcenter codepush release-react -a [put_your_android_staging_codepush_id_here] -d Staging --sourcemap-output --output-dir ./build`);
        value = value.replace(`appcenter codepush release-react -a fajar-virtualspirit.me/VsBoilerPlate-iOS -d Production --sourcemap-output --output-dir ./build`, `appcenter codepush release-react -a [put_your_ios_production_codepush_id_here] -d Production --sourcemap-output --output-dir ./build`);
        value = value.replace(`appcenter codepush release-react -a fajar-virtualspirit.me/VsBoilerPlate-iOS -d Staging --sourcemap-output --output-dir ./build`, `appcenter codepush release-react -a [put_your_ios_staging_codepush_id_here] -d Staging --sourcemap-output --output-dir ./build`);
        fs.writeFileSync(`${targetPath}/package.json`, value, 'utf-8')


        value = fs.readFileSync(`${targetPath}/app.json`, {encoding: 'utf-8'})
        value = value.replaceAll(CURRENT_PROJECT_NAME, projectName);
        fs.writeFileSync(`${targetPath}/app.json`, value, 'utf-8')
    } catch (error) {
        console.log('failed update .json')
    }
}

function findAndReplaceIOS(path, projectName) {
    try {
        const dirs = fs.readdirSync(path)
        dirs.forEach(dir => {
            let newDir = `${path}/${dir}`
            if (newDir.includes(CURRENT_PROJECT_NAME)) {
                const oldDir = `${path}/${dir}`
                newDir = oldDir.replace(CURRENT_PROJECT_NAME, projectName)
                fs.renameSync(oldDir, newDir)
            }
            const isDir = fs.lstatSync(newDir).isDirectory() 
            if (isDir) {
                findAndReplaceIOS(newDir, projectName)
            } else {
                let value = fs.readFileSync(newDir, {encoding: 'utf-8'})
                value = value.replaceAll(CURRENT_PROJECT_NAME, projectName);
                value = value.replaceAll(CURRENT_PACKAGE_NAME, `com.${projectName.toLowerCase()}.app`);
                value = value.replaceAll("VSBoilerplateV2", projectName);
                fs.writeFileSync(newDir, value, 'utf-8')
            }
        })
    } catch (error) {
        console.log(error)
    }
}

// replace IOS
function handleIOSStructure(targetPath, projectName) {
    const IOSPath = `${targetPath}/ios`
    try {
        findAndReplaceIOS(IOSPath, projectName)
    } catch (error) {
        console.log(error)
    }
}


function findAndReplaceAndroid(path, projectName) {
    try {
        const dirs = fs.readdirSync(path)
        dirs.forEach(dir => {
            let newDir = `${path}/${dir}`
            if (newDir.includes(CURRENT_PROJECT_NAME.toLowerCase())) {
                const oldDir = `${path}/${dir}`
                newDir = oldDir.replace(CURRENT_PROJECT_NAME.toLowerCase(), projectName.toLowerCase())
                fs.renameSync(oldDir, newDir)

                if (newDir === `${projectName}/android/app/src/main/java/com/${projectName.toLowerCase()}` || newDir === `${projectName}/android/app/src/debug/java/com/${projectName.toLowerCase()}` || newDir === `${projectName}/android/app/src/release/java/com/${projectName.toLowerCase()}`) {
                    const appDir = `${newDir}/app`
                    fs.mkdirSync(`${appDir}/`)
                    const subDirs = fs.readdirSync(newDir)
                    subDirs.forEach(subdir => {
                        if (`${newDir}/${subdir}` !== appDir) {
                            fsx.moveSync(`${newDir}/${subdir}`, `${appDir}/${subdir}`)
                        }
                    })

                }
            }

            const isDir = fs.lstatSync(newDir).isDirectory() 
            if (isDir) {
                findAndReplaceAndroid(newDir, projectName)
            } else {
                if (newDir.includes('gradle-wrapper.jar') || newDir.includes('gradlew') || newDir.includes('gradlew.bat') || newDir.includes('.keystore')) {
                    return
                }
                let value = fs.readFileSync(newDir, {encoding: 'utf-8'})
                value = value.replaceAll(CURRENT_PROJECT_NAME, projectName);
                value = value.replaceAll(CURRENT_PACKAGE_NAME, `com.${projectName.toLowerCase()}.app`);
                value = value.replaceAll("VSBoilerPlateV2", projectName);
                value = value.replaceAll("VSBoilerPlate", projectName);
                fs.writeFileSync(newDir, value, 'utf-8')
            }
        })
    } catch (error) {
        console.log(error)
    }
}


// replace Android
function handleAndroidStructure(targetPath, projectName) {
    const AndroidPath = `${targetPath}/android`
    try {
        findAndReplaceAndroid(AndroidPath, projectName)
    } catch (error) {
        console.log(error)
    }
}
