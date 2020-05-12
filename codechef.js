let fs = require("fs");
let puppeteer = require("puppeteer");
let credentials = process.argv[2];
let path = require("path");
let final = {
    details : []
};
(async function(){
    try{
        let browser = await puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:["--start-maximized"]
        });
        let pages = await browser.pages();
        let tab = pages[0];
        let data = await fs.promises.readFile(credentials);
        let {url, pwd, user} = JSON.parse(data);
        await tab.goto(url, {waitUntil: "networkidle0"});
        await tab.waitForSelector("#edit-name", {visible:true});
        await tab.type("#edit-name",user,{delay:100});
        await tab.type("#edit-pass",pwd,{delay:100});
        await tab.click("#edit-submit");
        await tab.waitForSelector("#menu-302",{visible:true});
        await tab.click("#menu-302");    
        await tab.waitForSelector(".text-center a",{visible:true});
        let anc = await tab.$(".text-center a");
        let href = await tab.evaluate(function(elem){
            return elem.getAttribute("href");
        },anc);
        let newTab = await browser.newPage();
        await newTab.goto("https://www.codechef.com"+href);
        await newTab.waitForSelector(".problem-tagbox-top a",{visible:true});
        let allTags = await newTab.$$(".problem-tagbox-top a");
        console.log(allTags.length);

        // Here you can choose as many tags as you want to process in the below for loop

        for(let i=0;i<10;i++){
                let name = await newTab.evaluate(function(elem){
                    return elem.getAttribute("href");
                },allTags[i]);
                let base = path.basename(name);
                let nextTab = await browser.newPage();
                await nextTab.goto("https://www.codechef.com"+name, {waitUntil:"networkidle0"});
                await nextTab.waitForSelector(".problem-tagbox-headtext a",{visible:true});
                let allQuestions = await nextTab.$$(".problem-tagbox-headtext a");
                // await console.log(" TagName: "+base+"    NumberOfQuestions: "+allQuestions.length);
                // await data.push(Promise.all([base,allQuestions.length]));
                let ques = [];
                for(let j=0;j<allQuestions.length;j+=2){
                    let q = await nextTab.evaluate(function(elem){
                        return elem.getAttribute("href");
                    },allQuestions[j]);
                    let tagName = path.basename(q);
                    ques.push(tagName);
                }
                let obj = {
                    tagName: base,
                    numberOfQuestions: allQuestions.length/2,
                    problems: ques
                }
                //let content = JSON.stringify(obj);
                final.details.push(obj);
                await nextTab.close();    
        }
        console.table(final.details);
        final = JSON.stringify(final);
        fs.writeFileSync("Tags.json",final);
        await newTab.goto("https://www.codechef.com/logout",{waitUntil:"networkidle0"});
        await newTab.close();
        await tab.close();
    }catch(err){
        console.log(err);
    }
})();