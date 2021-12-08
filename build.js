var path=require('path')
const childProcess = require('child_process');
var fs=require('fs')
console.log(__dirname);
var vuejspath=path.join(__dirname,'/../hamian-wallet-vuejs');
var elecronpath=__dirname;
const run = (cmd ) => {

    return new Promise((res,rej)=>{

        console.log('running: ', cmd)
    
        const p = childProcess.exec(cmd);
        p.stdout.on('data', ( data ) => console.log(data));
        p.on('error', function (err) { rej(err); });
        p.on('exit', function (code) { 
            console.log('exited', code); res();
        
        });
    })
}
function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target,tragetFolder ) {
    var files = [];

    // Check if folder needs to be created or integrated
    console.log(path.basename( source ))
    var name=path.basename( source ) ;
    if(tragetFolder)
    {
        name=tragetFolder
    }
    var targetFolder = path.join( target,name );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}
var main =async function()
{
    await run('npm --prefix '+vuejspath+' run build'); 
    if (!fs.existsSync(elecronpath+'/dist/unpack')){
        fs.mkdirSync(elecronpath+'/dist/unpack', { recursive: true });
    } 
    copyFolderRecursiveSync(vuejspath+'/dist',elecronpath+'/dist','unpack')
    await run('asar pack '+(elecronpath+'/dist/unpack')+' dist/app.asar')
    await run("electron-packager ./  Hamian --platform=win32 --arch=x64 --overwrite force --out=./dist")
    // fs.rmdirSync(elecronpath+'/dist/Hamian-win32-x64/resources/app', { recursive: true });
    // fs.mkdirSync(elecronpath+'/dist/Hamian-win32-x64/resources/app', { recursive: true });
    copyFileSync(elecronpath+'/dist/app.asar',elecronpath+'/dist/Hamian-win32-x64/resources/app/app.asar')
    fs.writeFileSync(elecronpath+'/dist/Hamian-win32-x64/.env','APP_URL=app.asar/index.html')
    console.log('>>Finished<<');
}
main()