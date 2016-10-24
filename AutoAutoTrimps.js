// ==UserScript==
// @name         AutoAutoTrimps-hider
// @namespace    http://tampermonkey.net/
// @version      2.1.3H-hider-17-8-2016
// @description  Automate the AutoTrimps!
// @author       zininzinin, spindrjr, belaith, ishakaru, genBTC
// @include      *trimps.github.io*
// @grant        none
// ==/UserScript==

////////////////////////////////////////
//Variables/////////////////////////////
////////////////////////////////////////
var ATversion = '2.1.2.1h-hider-11-8-2016';
var AutoTrimpsDebugTabVisible = true;
var enableDebug = true; //Spam console
var autoTrimpSettings = {};
var bestBuilding;
var scienceNeeded;
var breedFire = false;
var shouldFarm = false;
var enoughDamage = true;
var enoughHealth = true;
var stopScientistsatFarmers;

var baseDamage = 0;
var baseBlock = 0;
var baseHealth = 0;

var preBuyAmt = game.global.buyAmt;
var preBuyFiring = game.global.firing;
var preBuyTooltip = game.global.lockTooltip;
var preBuymaxSplit = game.global.maxSplit;

////////////////////////////////////////
//Magic Numbers/////////////////////////
////////////////////////////////////////
var runInterval = 100;      //How often to loop through logic
var startupDelay = 2000;    //How long to wait for everything to load

////////////////////////////////////////
//List Variables////////////////////////
////////////////////////////////////////
var equipmentList = {
    'Dagger': {
        Upgrade: 'Dagadder',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Mace': {
        Upgrade: 'Megamace',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Polearm': {
        Upgrade: 'Polierarm',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Battleaxe': {
        Upgrade: 'Axeidic',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Greatsword': {
        Upgrade: 'Greatersword',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Gambeson': {
        Upgrade: 'GambesOP',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Breastplate': {
        Upgrade: 'Bestplate',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Shoulderguards': {
        Upgrade: 'Smoldershoulder',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Pants': {
        Upgrade: 'Pantastic',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Helmet': {
        Upgrade: 'Hellishmet',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Boots': {
        Upgrade: 'Bootboost',
        Stat: 'health',
        Resource: 'metal',
        Equip: true
    },
    'Arbalest': {
        Upgrade: 'Harmbalest',
        Stat: 'attack',
        Resource: 'metal',
        Equip: true
    },
    'Shield': {
        Upgrade: 'Supershield',
        Stat: 'health',
        Resource: 'wood',
        Equip: true
    },
    'Gym': {
        Upgrade: 'Gymystic',
        Stat: 'block',
        Resource: 'wood',
        Equip: false
    }
};

var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock'];
var housingList = ['Warpstation'];


////////////////////////////////////////
//Utility Functions/////////////////////
////////////////////////////////////////
//polyfill for includes function
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

//Loads the automation settings from browser cache
function loadPageVariables() {
    var tmp = JSON.parse(localStorage.getItem('autoTrimpSettings'));
    if (tmp !== null) {
        autoTrimpSettings = tmp;
    }
}

//Saves automation settings to browser cache
function saveSettings() {
    // debug('Saved');
    localStorage.setItem('autoTrimpSettings', JSON.stringify(autoTrimpSettings));
}

//Grabs the automation settings from the page

function getPageSetting(setting) {
    if (autoTrimpSettings.hasOwnProperty(setting) == false) {
        return false;
    }
    if (autoTrimpSettings[setting].type == 'boolean') {
        // debug('found a boolean');
        return autoTrimpSettings[setting].enabled;
    } else if (autoTrimpSettings[setting].type == 'value') {
        // debug('found a value');
        return parseFloat(autoTrimpSettings[setting].value);
    }
}

//programmatically sets the underlying variable of the UI Setting and the appropriate Button CSS style&color
function setPageSetting(setting,value) {
    if (autoTrimpSettings.hasOwnProperty(setting) == false) {
        return false;
    }
    if (autoTrimpSettings[setting].type == 'boolean') {
        // debug('found a boolean');
        autoTrimpSettings[setting].enabled = value;
        document.getElementById(setting).setAttribute('class', 'settingsBtn settingBtn' + autoTrimpSettings[setting].enabled);
    } else if (autoTrimpSettings[setting].type == 'value') {
        // debug('found a value');
        autoTrimpSettings[setting].value = value;
    } else if (autoTrimpSettings[setting].type == 'dropdown') {
        autoTrimpSettings[setting].selected = value;
    }
    updateCustomButtons();
    saveSettings();
    checkSettings();
}

//Global debug message
function debug(message, lootIcon) {
    if (enableDebug) {
        console.log(timeStamp() + ' ' + message);
        message2(message, "AutoTrimps", lootIcon);
    }
}

//Simply returns a formatted text timestamp
function timeStamp() {
    var now = new Date();

    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }
    return time.join(":");
}

function getPerSecBeforeManual(job) {
    var perSec = 0;
    if (game.jobs[job].owned > 0){
        perSec = (game.jobs[job].owned * game.jobs[job].modifier);
        if (game.portal.Motivation.level > 0) perSec += (perSec * game.portal.Motivation.level * game.portal.Motivation.modifier);
        if (game.portal.Motivation_II.level > 0) perSec *= (1 + (game.portal.Motivation_II.level * game.portal.Motivation_II.modifier));
        if (game.portal.Meditation.level > 0) perSec *= (1 + (game.portal.Meditation.getBonusPercent() * 0.01)).toFixed(2);
        if (game.global.challengeActive == "Meditate") perSec *= 1.25;
        else if (game.global.challengeActive == "Size") perSec *= 1.5;
        if (game.global.challengeActive == "Toxicity"){
            var toxMult = (game.challenges.Toxicity.lootMult * game.challenges.Toxicity.stacks) / 100;
            perSec *= (1 + toxMult);
        }
        if (game.global.challengeActive == "Balance"){
            perSec *= game.challenges.Balance.getGatherMult();
        }
        if (game.global.challengeActive == "Watch") perSec /= 2;
        if (game.global.challengeActive == "Lead" && ((game.global.world % 2) == 1)) perSec*= 2;
        perSec = calcHeirloomBonus("Staff", job + "Speed", perSec);
    }
    return perSec
}

//Called before buying things that can be purchased in bulk
function preBuy() {
    preBuyAmt = game.global.buyAmt;
    preBuyFiring = game.global.firing;
    preBuyTooltip = game.global.lockTooltip;
    preBuymaxSplit = game.global.maxSplit;
}

//Called after buying things that can be purchased in bulk
function postBuy() {
    game.global.buyAmt = preBuyAmt;
    game.global.firing = preBuyFiring;
    game.global.lockTooltip = preBuyTooltip;
    game.global.maxSplit = preBuymaxSplit;
}

function safeBuyJob(jobTitle, amount) {
    if (amount === undefined) amount = 1;
    if (amount === 0) return false;
    preBuy();
    if (amount < 0) {
        amount = Math.abs(amount);
        game.global.firing = true;
        game.global.buyAmt = amount;
    } else{
        game.global.firing = false;
        game.global.buyAmt = amount;
        //if can afford, buy what we wanted,
        if (!canAffordJob(jobTitle, false)){
            game.global.buyAmt = 'Max'; //if we can't afford it, just use 'Max'. -it will always succeed-
            game.global.maxSplit = 1;
        }
    }   
    //debug((game.global.firing ? 'Firing ' : 'Hiring ') + game.global.buyAmt + ' ' + jobTitle + 's', "*users");
    buyJob(jobTitle, null, true);
    postBuy();
    return true;
}

//Returns the amount of stats that the equipment (or gym) will give when bought.
function Effect(gameResource, equip) {
    if (equip.Equip) {
        return gameResource[equip.Stat + 'Calculated'];
    } else {
        //That be Gym
        var oldBlock = gameResource.increase.by * gameResource.owned;
        var Mod = game.upgrades.Gymystic.done ? (game.upgrades.Gymystic.modifier + (0.01 * (game.upgrades.Gymystic.done - 1))) : 1;
        var newBlock = gameResource.increase.by * (gameResource.owned + 1) * Mod;
        return newBlock - oldBlock;
    }
}

//Returns the cost after Artisanistry of a piece of equipment.
function Cost(gameResource, equip) {
    preBuy();
    game.global.buyAmt = 1;
    var price = parseFloat(getBuildingItemPrice(gameResource, equip.Resource, equip.Equip, 1));
    if (equip.Equip) price = Math.ceil(price * (Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level)));
    postBuy();
    return price;
}

//Returns the amount of stats that the prestige will give when bought.
function PrestigeValue(what) {
    var name = game.upgrades[what].prestiges;
    var equipment = game.equipment[name];
    var stat;
    if (equipment.blockNow) stat = "block";
    else stat = (typeof equipment.health !== 'undefined') ? "health" : "attack";
    var toReturn = Math.round(equipment[stat] * Math.pow(1.19, ((equipment.prestige) * game.global.prestige[stat]) + 1));
    return toReturn;
}

function getScienceCostToUpgrade(upgrade) {
    var upgradeObj = game.upgrades[upgrade];
    if (upgradeObj.cost.resources.science !== undefined ? upgradeObj.cost.resources.science[0] !== undefined : false) {
        return Math.floor(upgradeObj.cost.resources.science[0] * Math.pow(upgradeObj.cost.resources.science[1], (upgradeObj.done)));
    } else if (upgradeObj.cost.resources.science !== undefined && upgradeObj.cost.resources.science[0] == undefined){
        return upgradeObj.cost.resources.science;
    } else {
        return 0;
    }
}

function setScienceNeeded() {
    scienceNeeded = 0;
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        if (game.upgrades[upgrade].allowed > game.upgrades[upgrade].done) { //If the upgrade is available
            if (game.global.world == 1 && game.global.totalHeliumEarned<=100 && upgrade.startsWith("Speed")) continue;  //skip speed upgrades on fresh game until level 2
            scienceNeeded += getScienceCostToUpgrade(upgrade);
        }
    }
}

function setTitle() {
    document.title = '(' + game.global.world + ')' + ' Trimps ' + document.getElementById('versionNumber').innerHTML;
    //for the dummies like me who always forget to turn automaps back on after portaling
    if(getPageSetting('RunUniqueMaps') && !game.upgrades.Battle.done && autoTrimpSettings.AutoMaps.enabled == false) {
        settingChanged("AutoMaps");
    }
}

function getEnemyMaxAttack(world, level, name, diff, corrupt) {
    var amt = 0;
    var adjWorld = ((world - 1) * 100) + level;
    amt += 50 * Math.sqrt(world) * Math.pow(3.27, world / 2);
    amt -= 10;
    if (world == 1){
        amt *= 0.35;
        amt = (amt * 0.20) + ((amt * 0.75) * (level / 100));
    }
    else if (world == 2){
        amt *= 0.5;
        amt = (amt * 0.32) + ((amt * 0.68) * (level / 100));
    }
    else if (world < 60)
        amt = (amt * 0.375) + ((amt * 0.7) * (level / 100));
    else{ 
        amt = (amt * 0.4) + ((amt * 0.9) * (level / 100));
        amt *= Math.pow(1.15, world - 59);
    }
    if (world < 60) amt *= 0.85;
    if (world > 6 && game.global.mapsActive) amt *= 1.1;
    if (diff) { 
        amt *= diff;
    }    
    if (!corrupt)
        amt *= game.badGuys[name].attack;
    else {
        amt *= mutations.Corruption.statScale(3);
    }
    return Math.floor(amt);
}

function getEnemyMaxHealth(world, level, corrupt) {
    if (!level)
        level = 1;
    var amt = 0;
    amt += 130 * Math.sqrt(world) * Math.pow(3.265, world / 2);
    amt -= 110;
    if (world == 1 || world == 2 && level < 10) {
        amt *= 0.6;
        amt = (amt * 0.25) + ((amt * 0.72) * (level / 100));
    }
    else if (world < 60)
        amt = (amt * 0.4) + ((amt * 0.4) * (level / 110));
    else {
        amt = (amt * 0.5) + ((amt * 0.8) * (level / 100));
        amt *= Math.pow(1.1, world - 59);
    }
    if (world < 60) amt *= 0.75;        
    if (world > 5 && game.global.mapsActive) amt *= 1.1;
    if (!corrupt)
        amt *= game.badGuys["Grimp"].health;
    else
        amt *= mutations.Corruption.statScale(10);
    return Math.floor(amt);
}

function getCurrentEnemy(current) {
    if (!current)
        current = 1;
    var enemy;
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        if (typeof game.global.gridArray[game.global.lastClearedCell + current] === 'undefined') {
            enemy = game.global.gridArray[0];
        } else {
            enemy = game.global.gridArray[game.global.lastClearedCell + current];
        }
    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        if (typeof game.global.mapGridArray[game.global.lastClearedMapCell + current] === 'undefined') {
            enemy = game.global.mapGridArray[0];
        } else {
            enemy = game.global.mapGridArray[game.global.lastClearedMapCell + current];
        }
    }
    return enemy;
}

function getBreedTime(remaining,round) {
    var trimps = game.resources.trimps;
    var breeding = trimps.owned - trimps.employed;
    var trimpsMax = trimps.realMax();

    var potencyMod = trimps.potency;
    //Broken Planet
    if (game.global.brokenPlanet) potencyMod /= 10;
    //Pheromones
    potencyMod *= 1+ (game.portal.Pheromones.level * game.portal.Pheromones.modifier);
    //Geneticist
    if (game.jobs.Geneticist.owned > 0) potencyMod *= Math.pow(.98, game.jobs.Geneticist.owned);
    //Quick Trimps
    if (game.unlocks.quickTrimps) potencyMod *= 2;
    if (game.global.challengeActive == "Toxicity" && game.challenges.Toxicity.stacks > 0){
        potencyMod *= Math.pow(game.challenges.Toxicity.stackMult, game.challenges.Toxicity.stacks);
    }
    if (game.global.voidBuff == "slowBreed"){
        potencyMod *= 0.2;
    }

    potencyMod = calcHeirloomBonus("Shield", "breedSpeed", potencyMod);
    breeding = breeding * potencyMod;
    updatePs(breeding, true);
    potencyMod = (1 + (potencyMod / 10));
    var timeRemaining = log10((trimpsMax - trimps.employed) / (trimps.owned - trimps.employed)) / log10(potencyMod);
    timeRemaining /= 10;
    if (remaining)
        return parseFloat(timeRemaining.toFixed(1));

    var fullBreed = 0;
    var adjustedMax = (game.portal.Coordinated.level) ? game.portal.Coordinated.currentSend : trimps.maxSoldiers;
    var totalTime = log10((trimpsMax - trimps.employed) / (trimpsMax - adjustedMax - trimps.employed)) / log10(potencyMod);

    totalTime /= 10;

    return parseFloat(totalTime.toFixed(1));
}

function initializeAutoTrimps() {
    debug('AutoTrimps v' + ATversion + ' Loaded!', '*spinner3');
    loadPageVariables();

    var atscript = document.getElementById('AutoTrimps-script')
      , base = 'https://ansopedi.github.io/AutoTrimps';
    if (atscript !== null) {
        base = atscript.getAttribute('src').replace(/\/AutoAutoTrimps.js$/, '');
    }
    document.head.appendChild(document.createElement('script')).src = base + '/SettingsUI.js';
    document.head.appendChild(document.createElement('script')).src = base + '/HiderGraphs.js';
    document.head.appendChild(document.createElement('script')).src = base + '/AutoAutoPerks.js';
    document.head.appendChild(document.createElement('script')).src = base + '/HiderTrimp.js';
    toggleSettingsMenu();
    toggleSettingsMenu();
}

function workerRatios() {
        autoTrimpSettings.FarmerRatio.value = '1';
        autoTrimpSettings.LumberjackRatio.value = '10';
        autoTrimpSettings.MinerRatio.value = '5000';
}

//An error-resilient function that will actually purchase buildings and return a success status
function safeBuyBuilding(building) {
    if (game.buildings[building].locked)
        return false;
    //limit to 1 building per queue
    for (var b in game.global.buildingsQueue) {
        if (game.global.buildingsQueue[b].includes(building)) return false;
    }
    preBuy();
    game.global.buyAmt = 1;
    if (!canAffordBuilding(building)) {
        postBuy();
        return false;
    }
    game.global.firing = false;
    //avoid slow building from clamping
    //buy as many warpstations as we can afford but buys the last warpstations in single.
    if (bestBuilding == "Warpstation" && getBuildingItemPrice(game.buildings.Warpstation, "metal", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) > game.resources.metal.owned/20) {
        game.global.buyAmt = 1;
    } else {
    	game.global.buyAmt = 'Max';
        game.global.maxSplit = 1;
        buyBuilding(building, true, true);
        debug('Building ' + game.global.buyAmt + ' ' + building + 's', '*rocket');
        return;
    }
    debug('Building ' + building, '*hammer2');
    buyBuilding(building, true, true);
    postBuy();
    return true;
}

//Outlines the most efficient housing based on gems (credits to Belaith)
function highlightHousing() {
    var oldBuy = game.global.buyAmt;
    game.global.buyAmt = 1;
    var allHousing = ["Warpstation"];
    var unlockedHousing = [];
    for (var house in allHousing) {
        if (game.buildings[allHousing[house]].locked === 0) {
            unlockedHousing.push(allHousing[house]);
        }
    }
    if (unlockedHousing.length) {
        var obj = {};
        for (var house in unlockedHousing) {
            var building = game.buildings[unlockedHousing[house]];
            var cost = 0;
            cost += getBuildingItemPrice(building, "gems", false, 1);
            var ratio = cost / building.increase.by;
            //don't consider Gateway if we can't afford it right now - hopefully to prevent game waiting for fragments to buy gateway when collector could be bought right now
            if(unlockedHousing[house] == "Gateway" && !canAffordBuilding('Gateway')) continue;
            obj[unlockedHousing[house]] = ratio;
            if (document.getElementById(unlockedHousing[house]).style.border = "1px solid #00CC00") {
                document.getElementById(unlockedHousing[house]).style.border = "1px solid #FFFFFF";
                // document.getElementById(unlockedHousing[house]).removeEventListener("click", update);
            }
        }
        var keysSorted = Object.keys(obj).sort(function(a, b) {
            return obj[a] - obj[b];
        });
        bestBuilding = null;
        //loop through the array and find the first one that isn't limited by max settings
        for (var best in keysSorted) {
            var max = getPageSetting('Max' + keysSorted[best]);
            if (max === false) max = -1;
            if (game.buildings[keysSorted[best]].owned < max || max == -1) {
                bestBuilding = keysSorted[best];
                    if (game.buildings.Warpstation.owned >= (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')))
                        bestBuilding = null;
                
                if ((hiderwindow < 10.0 || getPageSetting('WarpstationWall')) && bestBuilding == "Warpstation") {
                    //Warpstation Wall - allow only warps that cost 1/n'th less then current metal (try to save metal for next prestige) 
                    var costratio = 12;  //(1/4th)                    
                    if (getBuildingItemPrice(game.buildings.Warpstation, "metal", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) > game.resources.metal.owned/costratio)
                        bestBuilding = null;
                }
                break;
            }
        }
        if (bestBuilding) {
            document.getElementById(bestBuilding).style.border = "1px solid #00CC00";
        }
        // document.getElementById(bestBuilding).addEventListener('click', update, false);
        } else {
        bestBuilding = null;
    }
    game.global.buyAmt = oldBuy;
}

//Helper function to buy best "Food" Buildings
function buyFoodEfficientHousing() {
    // Push the limit auto change your max buildings settings		
    autoTrimpSettings.MaxHut.value = game.global.world < 35 ? 50 : game.global.world*2.3; //10+game.buildings.House.owned;2.5		
    autoTrimpSettings.MaxHouse.value = game.global.world < 35 ? 50 : game.global.world*2.6;		
    autoTrimpSettings.MaxMansion.value = game.global.world < 35 ? 50 : game.global.world*2.8; //20+game.buildings.House.owned;2.9		
    autoTrimpSettings.MaxHotel.value = game.global.world < 35 ? 50 : game.global.world*3; //30+game.buildings.House.owned;3.1		
    autoTrimpSettings.MaxResort.value = game.global.world < 35 ? 50 : game.global.world*3.2; //40+game.buildings.House.owned; 3.3		
    autoTrimpSettings.MaxGateway.value = game.global.world < 35 ? 25 : game.global.world*0.8;
    var houseWorth = game.buildings.House.locked ? 0 : game.buildings.House.increase.by / getBuildingItemPrice(game.buildings.House, "food", false, 1);
    var hutWorth = game.buildings.Hut.increase.by / getBuildingItemPrice(game.buildings.Hut, "food", false, 1);
    var hutAtMax = (game.buildings.Hut.owned >= autoTrimpSettings.MaxHut.value && autoTrimpSettings.MaxHut.value != -1);
}

//Main Decision Function that determines cost efficiency and Buys all housing (gems), or calls buyFoodEfficientHousing, and also non-storage buildings (Gym,Tribute,Nursery)s
function buyBuildings() {
    if(game.global.world!=1 && ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist")))
        return;
    highlightHousing();

    //if housing is highlighted
    if (bestBuilding !== null && game.global.buildingsQueue.length == 0) {
        //insert gigastation logic here ###############
        if (!safeBuyBuilding(bestBuilding)) {
            buyFoodEfficientHousing();
        }
    } else {
        buyFoodEfficientHousing();
    }
    
    if(getPageSetting('MaxWormhole') > 0 && game.buildings.Wormhole.owned < getPageSetting('MaxWormhole') && !game.buildings.Wormhole.locked) safeBuyBuilding('Wormhole');

    //Buy non-housing buildings
    if (!game.buildings.Gym.locked && (getPageSetting('MaxGym') > game.buildings.Gym.owned || getPageSetting('MaxGym') == -1)) {
       //safeBuyBuilding('Gym');
    }
    if (!game.buildings.Tribute.locked && (getPageSetting('MaxTribute') > game.buildings.Tribute.owned || getPageSetting('MaxTribute') == -1)) {
        safeBuyBuilding('Tribute');
    }
    var targetBreed = parseInt(getPageSetting('GeneticistTimer'));
    //only buy nurseries if enabled,   and we need to lower our breed time, or our target breed time is 0, or we aren't trying to manage our breed time before geneticists, and they aren't locked
    //even if we are trying to manage breed timer pre-geneticists, start buying nurseries once geneticists are unlocked AS LONG AS we can afford a geneticist (to prevent nurseries from outpacing geneticists soon after they are unlocked)
    if ((targetBreed < getBreedTime() || targetBreed == 0 || !getPageSetting('ManageBreedtimer') || 
        (targetBreed < getBreedTime(true) && game.global.challengeActive == 'Watch') ||
        (!game.jobs.Geneticist.locked && canAffordJob('Geneticist', false))) && !game.buildings.Nursery.locked) 
    {
        if ((getPageSetting('MaxNursery') > game.buildings.Nursery.owned || getPageSetting('MaxNursery') == -1) && 
            (getBuildingItemPrice(game.buildings.Nursery, "wood", false, 1) < game.resources.wood.owned/50) && 
            (getBuildingItemPrice(game.buildings.Nursery, "gems", false, 1) < 0.05 * getBuildingItemPrice(game.buildings.Collector, "gems", false, 1) || game.buildings.Collector.locked || !game.buildings.Warpstation.locked))
        {
            safeBuyBuilding('Nursery');
        }
    }
}

//Back end function for autoLevelEquipment to determine most cost efficient items, and what color they should be.
var mapresourcetojob = {"food": "Farmer", "wood": "Lumberjack", "metal": "Miner", "science": "Scientist"};  //map of resource to jobs
function evaluateEquipmentEfficiency(equipName) {
    var equip = equipmentList[equipName];
    var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
    if (equipName == 'Shield') {
        if (gameResource.blockNow) {
            equip.Stat = 'block';
        } else {
            equip.Stat = 'health';
        }
    }
    var Eff = Effect(gameResource, equip);
    var Cos = Cost(gameResource, equip);
    var Res = Eff / Cos;
    var Status = 'white';
    var Wall = false;

    //white - Upgrade is not available
    //yellow - Upgrade is not affordable
    //orange - Upgrade is affordable, but will lower stats
    //red - Yes, do it now!
    if (!game.upgrades[equip.Upgrade].locked) {
        //Evaluating upgrade!
        var CanAfford = canAffordTwoLevel(game.upgrades[equip.Upgrade]);
        if (equip.Equip) {
            var NextEff = PrestigeValue(equip.Upgrade);
            //Scientist 3 and 4 challenge: set metalcost to Infinity so it can buy equipment levels without waiting for prestige. (fake the impossible science cost)
            //also Fake set the next cost to infinity so it doesn't wait for prestiges if you have both options disabled.
            if ((game.global.challengeActive == "Scientist" && getScientistLevel() > 2) || ((!getPageSetting('BuyArmorUpgrades') && !getPageSetting('BuyWeaponUpgrades'))))
                var NextCost = Infinity;
            else
                var NextCost = Math.ceil(getNextPrestigeCost(equip.Upgrade) * Math.pow(1 - game.portal.Artisanistry.modifier, game.portal.Artisanistry.level));
            Wall = (NextEff / NextCost > Res);
        }

        if (!CanAfford) {
            Status = 'yellow';
        } else {
            if (!equip.Equip) {
                //Gymystic is always cool, fuck shield - lol
                Status = 'red';
            } else {
                var CurrEff = gameResource.level * Eff;

                var NeedLevel = Math.ceil(CurrEff / NextEff);
                var Ratio = gameResource.cost[equip.Resource][1];

                var NeedResource = NextCost * (Math.pow(Ratio, NeedLevel) - 1) / (Ratio - 1);

                if (game.resources[equip.Resource].owned > NeedResource) {
                    Status = 'red';
                } else {
                    Status = 'orange';
                }
            }
        }
    }
    //what this means:
    //wall (don't buy any more equipment, buy prestige first) is true if the limit equipment option is on and we are past our limit 
    //res = 0 sets the efficiency to 0 so that it will be disregarded. if not, efficiency will still be somenumber that is cheaper, 
    //      and the algorithm will get stuck on whatever equipment we have capped, and not buy other equipment.
    if (game.jobs[mapresourcetojob[equip.Resource]].locked){
        //cap any equips that we haven't unlocked metal for (new/fresh game/level1/no helium code)
        Res = 0;
        Wall = true;        
    }
    if (gameResource.level > 10 - gameResource.prestige && getPageSetting('LimitEquipment')) {
        Res = 0;
        Wall = true;
    }
    if (gameResource.level >= 10 && getPageSetting('CapEquip')) {
        Res = 0;
        Wall = true;
    }
    if (game.global.world >= 58 && game.global.world < 60 && getPageSetting('WaitTill60')){
        Wall = true;
    }
    if (gameResource.level < 2 && equip.Stat == 'health' && getPageSetting('AlwaysArmorLvl2')){
        Res = 9999 - gameResource.prestige;
    }
    //manage prestige
    if (hiderwindow > 20 && game.global.world != 200 && equip.Stat == 'attack' && gameResource.level > 1) {
        Wall = true;
    }
    if (10*Cos > NextCost && equip.Stat == 'attack' && game.global.world > 37 && hiderwindow > 3) {
        Wall = true;
    }
    if ((gameResource.prestige < ((game.global.world-10)/5)+2 && gameResource.level > 2) && (equip.Stat == 'attack') && game.global.world > 37 && hiderwindow > 3) {		
        Res = 0;
        Wall = true;
    }
    if (gameResource.prestige+1 < ((game.global.world-10)/5)+2 && gameResource.level > 0 && game.global.world > 37 && hiderwindow > 3) {		
        Res = 0;
        Wall = true;
    }
    if (gameResource.level > 11 && game.global.world != 200 && game.global.world > 37 && (game.global.world < 200 || ( game.global.world > 200 && (4 * Cos) > game.resources.metal.owned))) {		
        Res = 0;
        Wall = true;
    }

    return {
        Stat: equip.Stat,
        Factor: Res,
        Status: Status,
        Wall: Wall
    };
}

//Buys all available non-equip upgrades listed in var upgradeList
function buyUpgrades() {
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
		if (upgrade == 'Gigastation') {
            buyUpgrade('Gigastation', true, true);
            return;
        }
        if (upgrade == 'Coordination' && !canAffordCoordinationTrimps()) continue;
        if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
        if ((game.global.lastWarp >= game.buildings.Warpstation.owned && upgrade == 'Gigastation') || upgrade == 'Gigastation' && (game.global.lastWarp ? (game.buildings.Warpstation.owned < game.global.lastWarp + getPageSetting('DeltaGigastation') + 0 - gameUpgrade.allowed + gameUpgrade.done) : game.buildings.Warpstation.owned < getPageSetting('FirstGigastation'))) continue;
        if ((!game.upgrades.Scientists.done && upgrade != 'Battle') ? (available && upgrade == 'Scientists' && game.upgrades.Scientists.allowed) : (available)) {
            buyUpgrade(upgrade, true, true);
            debug('Upgraded ' + upgrade,"*upload2");
        }
        //skip bloodlust during scientist challenges and while we have autofight enabled.
        if (upgrade == 'Bloodlust' && game.global.challengeActive == 'Scientist' && getPageSetting('AutoFight'))    continue;
    }
}

//Buys more storage if resource is over 85% full (or 50% if Zone 2-10) (or 70% if zone==1)
function buyStorage() {
    var packMod = 1 + game.portal.Packrat.level * game.portal.Packrat.modifier;
    var Bs = {
        'Barn': 'food',
        'Shed': 'wood',
        'Forge': 'metal'
    };
    for (var B in Bs) {
        var jest = 0;
        var owned = game.resources[Bs[B]].owned;
        var max = game.resources[Bs[B]].max * packMod;
        max = calcHeirloomBonus("Shield", "storageSize", max);
        if(game.global.mapsActive && game.unlocks.imps.Jestimp) {
            jest = simpleSeconds(Bs[B], 45);
            jest = scaleToCurrentMap(jest);
        }
        if (owned > max * 0.6 || (owned + jest > max * 0.8)) {
            // debug('Buying ' + B + '(' + Bs[B] + ') at ' + Math.floor(game.resources[Bs[B]].owned / (game.resources[Bs[B]].max * packMod * 0.99) * 100) + '%');
            if (canAffordBuilding(B) && game.triggers[B].done) {
                safeBuyBuilding(B);
                if (getPageSetting('ManualGather')) setGather('buildings');
            }
        }
    }
}

//Hires and Fires all workers (farmers/lumberjacks/miners/scientists/trainers/explorers)
function buyJobs() {
    var freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    var trimps = game.resources.trimps;
    var totalDistributableWorkers = freeWorkers + game.jobs.Farmer.owned + game.jobs.Miner.owned + game.jobs.Lumberjack.owned;    
    var farmerRatio = parseInt(getPageSetting('FarmerRatio'));
    var lumberjackRatio = parseInt(getPageSetting('LumberjackRatio'));
    var minerRatio = parseInt(getPageSetting('MinerRatio'));
    var totalRatio = farmerRatio + lumberjackRatio + minerRatio;
    var scientistRatio = farmerRatio / 25;
    if (game.jobs.Farmer.owned < 100) {
        scientistRatio = totalRatio / 10;
    }
    
    //FRESH GAME LEVEL 1 CODE
    if (game.global.world == 1 && game.global.totalHeliumEarned<=100){
        if (game.resources.trimps.owned < game.resources.trimps.realMax() * 0.9){
            if (game.resources.food.owned > 5 && freeWorkers > 0){
                if (game.jobs.Farmer.owned == game.jobs.Lumberjack.owned)
                    safeBuyJob('Farmer', 1);
                else if (game.jobs.Farmer.owned > game.jobs.Lumberjack.owned && !game.jobs.Lumberjack.locked)
                    safeBuyJob('Lumberjack', 1);
            }
            if (game.resources.food.owned > 20 && freeWorkers > 0){
                if (game.jobs.Farmer.owned == game.jobs.Lumberjack.owned && !game.jobs.Miner.locked)
                    safeBuyJob('Miner', 1);
            }
        }
        return;
    }
    
    if (game.global.challengeActive == 'Watch'){
        scientistRatio = totalRatio / 10;
        stopScientistsatFarmers = 1e8;
        if (game.resources.trimps.owned < game.resources.trimps.realMax() * 0.9 && !breedFire){
            //so the game buys scientists first while we sit around waiting for breed timer.
            var buyScientists = Math.floor((scientistRatio / totalRatio * totalDistributableWorkers) - game.jobs.Scientist.owned);
            if (game.jobs.Scientist.owned < buyScientists && game.resources.trimps.owned > game.resources.trimps.realMax() * 0.1){
                var toBuy = buyScientists-game.jobs.Scientist.owned;
                var canBuy = Math.floor(trimps.owned - trimps.employed);
                if(buyScientists > 0 && freeWorkers > 0)
                    safeBuyJob('Scientist',toBuy <= canBuy ? toBuy : canBuy);
            }
            else
                return;
        }
    }
    else
    {   //exit if we are havent bred to at least 90% breedtimer yet...
        if (game.resources.trimps.owned < game.resources.trimps.realMax() * 0.9 && !breedFire) return;
    }
    
    var oldBuy = game.global.buyAmt;
    
    //Trainers capped to tributes percentage.
    var trainerpercent = getPageSetting('TrainerCaptoTributes');
    if (trainerpercent > 0){
        var curtrainercost = game.jobs.Trainer.cost.food[0]*Math.pow(game.jobs.Trainer.cost.food[1],game.jobs.Trainer.owned);
        var curtributecost = getBuildingItemPrice(game.buildings.Tribute, "food", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level);
        if (curtrainercost < curtributecost * (trainerpercent / 100) && (getPageSetting('MaxTrainers') > game.jobs.Trainer.owned || getPageSetting('MaxTrainers') == -1)) {
            game.global.buyAmt = 1;
            if (canAffordJob('Trainer', false) && !game.jobs.Trainer.locked) {
                freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
                if (freeWorkers <= 0) safeBuyJob('Farmer', -1);
                safeBuyJob('Trainer');
            }
        }
    }
    //regular old way of hard capping trainers to a certain number. (sorry about lazy duplicate coding)
    else if (getPageSetting('MaxTrainers') > game.jobs.Trainer.owned || getPageSetting('MaxTrainers') == -1) {
        game.global.buyAmt = 1;
        if (canAffordJob('Trainer', false) && !game.jobs.Trainer.locked) {
            freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
            if (freeWorkers <= 0) safeBuyJob('Farmer', -1);
            safeBuyJob('Trainer');
        }
    }
    if (game.jobs.Explorer.owned < getPageSetting('MaxExplorers') || getPageSetting('MaxExplorers') == -1) {
        game.global.buyAmt = 1;
        if (canAffordJob('Explorer', false) && !game.jobs.Explorer.locked) {
            freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
            if (freeWorkers <= 0) safeBuyJob('Farmer', -1);
            safeBuyJob('Explorer');
        }
    }
    game.global.buyAmt = oldBuy;
    freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    if (getPageSetting('HireScientists') && !game.jobs.Scientist.locked) {
        //if earlier in the game, buy a small amount of scientists
        if (game.jobs.Farmer.owned < stopScientistsatFarmers && !breedFire) {
            var buyScientists = Math.floor((scientistRatio / totalRatio * totalDistributableWorkers) - game.jobs.Scientist.owned);
            //bandaid to prevent situation where 1 scientist is bought, causing floor calculation to drop by 1, making next calculation -1 and entering hiring/firing loop
            //proper fix is including scientists in totalDistributableWorkers and the scientist ratio in the total ratio, but then it waits for 4 jobs
            if(buyScientists > 0 && freeWorkers > 0) safeBuyJob('Scientist', buyScientists);
        }
        //once over 250k farmers, fire our scientists and rely on manual gathering of science
        //else if (game.jobs.Scientist.owned > 0) safeBuyJob('Scientist', game.jobs.Scientist.owned * -1);
    }
    //Buy Farmers:
    if(!game.jobs.Farmer.locked && !breedFire) {
        var toBuy = Math.floor((farmerRatio / totalRatio * totalDistributableWorkers) - game.jobs.Farmer.owned);
        var canBuy = Math.floor(trimps.owned - trimps.employed);
        safeBuyJob('Farmer',toBuy <= canBuy ? toBuy : canBuy);
    }
    // else if(breedFire)
    // safeBuyJob('Farmer', game.jobs.Farmer.owned * -1);    
    //Buy/Fire Miners:
    if(!game.jobs.Miner.locked && !breedFire) {
        var toBuy = Math.floor((minerRatio / totalRatio * totalDistributableWorkers) - game.jobs.Miner.owned);
        var canBuy = Math.floor(trimps.owned - trimps.employed);
        safeBuyJob('Miner',toBuy <= canBuy ? toBuy : canBuy);
    }
    else if(breedFire && game.global.turkimpTimer === 0)
        safeBuyJob('Miner', game.jobs.Miner.owned * -1);
    //Buy/Fire Lumberjacks:
    if(!game.jobs.Lumberjack.locked && !breedFire) {
        var toBuy = Math.floor((lumberjackRatio / totalRatio * totalDistributableWorkers) - game.jobs.Lumberjack.owned);
        var canBuy = Math.floor(trimps.owned - trimps.employed);
        safeBuyJob('Lumberjack',toBuy <= canBuy ? toBuy : canBuy);
    }
    else if(breedFire)
        safeBuyJob('Lumberjack', game.jobs.Lumberjack.owned * -1);    

}

//"Buy Armor", "Buy Armor Upgrades", "Buy Weapons","Buy Weapons Upgrades"
function autoLevelEquipment() {
    //if((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist"))
        //return;
    var Best = {
        'healthwood': {
            Factor: 0,
            Name: '',
            Wall: false,
            Status: 'white'
        },
        'healthmetal': {
            Factor: 0,
            Name: '',
            Wall: false,
            Status: 'white'
        },
        'attackmetal': {
            Factor: 0,
            Name: '',
            Wall: false,
            Status: 'white'
        },
        'blockwood': {
            Factor: 0,
            Name: '',
            Wall: false,
            Status: 'white'
        }
    };
    var enemyDamage = getEnemyMaxAttack(game.global.world + 1, 30, 'Snimp', .85);
    var enemyHealth = getEnemyMaxHealth(game.global.world + 1);
    
    //below challenge multiplier not necessarily accurate, just fudge factors
    if(game.global.challengeActive == "Toxicity") {
        //ignore damage changes (which would effect how much health we try to buy) entirely since we die in 20 attacks anyway?
        if(game.global.world < 61)
            enemyDamage *= 2;
        enemyHealth *= 2;
    }
    if(game.global.challengeActive == 'Lead') {
        enemyDamage *= 2.5;
        enemyHealth *= 7;
    }
    //change name to make sure these are local to the function
    var enoughHealthE = !(doVoids && voidCheckPercent > 0) && (baseHealth * 4 > 30 * (enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : enemyDamage * 0.2) || baseHealth > 30 * (enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : enemyDamage * 0.2));
    var enoughDamageE = (baseDamage * 4 > enemyHealth);
    
    if (game.global.world == 200) { //&& ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) > 10 && ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < 20){		
    enoughHealthE = false;		
    enoughDamageE = false;		
    }

    for (var equipName in equipmentList) {
        var equip = equipmentList[equipName];
        // debug('Equip: ' + equip + ' EquipIndex ' + equipName);
        var gameResource = equip.Equip ? game.equipment[equipName] : game.buildings[equipName];
        // debug('Game Resource: ' + gameResource);
        if (!gameResource.locked) {
            document.getElementById(equipName).style.color = 'white';
            var evaluation = evaluateEquipmentEfficiency(equipName);
            // debug(equipName + ' evaluation ' + evaluation.Status);
            var BKey = equip.Stat + equip.Resource;
            // debug(equipName + ' bkey ' + BKey);

            if (Best[BKey].Factor === 0 || Best[BKey].Factor < evaluation.Factor) {
                Best[BKey].Factor = evaluation.Factor;
                Best[BKey].Name = equipName;
                Best[BKey].Wall = evaluation.Wall;
                Best[BKey].Status = evaluation.Status;
            }

            document.getElementById(equipName).style.borderColor = evaluation.Status;
            if (evaluation.Status != 'white' && evaluation.Status != 'yellow') {
                document.getElementById(equip.Upgrade).style.color = evaluation.Status;
            }
            if (evaluation.Status == 'yellow') {
                document.getElementById(equip.Upgrade).style.color = 'white';
            }
            if (evaluation.Wall) {
                document.getElementById(equipName).style.color = 'yellow';
            }

            //Code is Spaced This Way So You Can Read It:
            if (
                evaluation.Status == 'red' &&
                (
                    ( getPageSetting('BuyWeaponUpgrades') && equipmentList[equipName].Stat == 'attack' ) 
                    ||
                    ( getPageSetting('BuyWeaponUpgrades') && equipmentList[equipName].Stat == 'block' )
                    ||
                    ((getPageSetting('BuyArmorUpgrades') && ((equipmentList[equipName].Resource != 'metal')
                    || ((gameResource.prestige+5 <= (game.global.world-5)/5 && game.global.soldierHealth > 0 && ((armorTempValue > 50 && armorTempValue < 100)|| armorValue < 1000))
                    || (gameResource.prestige+4 <= (game.global.world-5)/5 && game.global.soldierHealth > 0 && ((armorTempValue > 20 && armorTempValue < 50)|| armorValue < 500))
                    || (gameResource.prestige+3 <= (game.global.world-5)/5 && game.global.soldierHealth > 0 && ((armorTempValue > 10 && armorTempValue < 20)|| armorValue < 200))
                    || (gameResource.prestige+2 <= (game.global.world-5)/5 && game.global.soldierHealth > 0 && ((armorTempValue > 1 && armorTempValue < 10)|| armorValue < 100)))
                    || gameResource.prestige < 5 || game.global.world == 200 ) && (equipmentList[equipName].Stat == 'health'))
                        && 
                //Only buy Armor prestiges when 'DelayArmorWhenNeeded' is on, IF:
                        (
                            (game.global.world == 200)  // not in level 200
                            ||
			(getPageSetting('DelayArmorWhenNeeded') && !shouldFarm)  // not during "Farming" mode 
                            ||                                                       //     or
                            (getPageSetting('DelayArmorWhenNeeded') && enoughDamage) //  has enough damage (not in "Wants more Damage" mode)
                            ||                                                       //     or        
                            (getPageSetting('DelayArmorWhenNeeded') && !enoughDamage && !enoughHealth) // if neither enough dmg or health, then tis ok to buy.
                            || 
                            (getPageSetting('DelayArmorWhenNeeded') && equipmentList[equipName].Resource == 'wood')
                            || 
                            !getPageSetting('DelayArmorWhenNeeded')  //or when its off.
                        )
                    )
                )
            ) 
            {
                var upgrade = equipmentList[equipName].Upgrade;
                if (upgrade != "Gymystic")
                    debug('Upgrading ' + upgrade + " - Prestige " + game.equipment[equipName].prestige, '*upload');
                else
                    debug('Upgrading ' + upgrade + " # " + game.upgrades[upgrade].allowed, '*upload');
                buyUpgrade(upgrade, true, true);
            }
        }
    }
    preBuy();
    game.global.buyAmt = 1;
    for (var stat in Best) {
        if (Best[stat].Name !== '') {
            var eqName = Best[stat].Name;
            var DaThing = equipmentList[eqName];
            document.getElementById(Best[stat].Name).style.color = Best[stat].Wall ? 'orange' : 'red';
            //If we're considering an attack item, we want to buy weapons if we don't have enough damage, or if we don't need health (so we default to buying some damage)
            if (getPageSetting('BuyWeapons') && DaThing.Stat == 'attack' && (!enoughDamageE || enoughHealthE)) {
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            //If we're considering a health item, buy it if we don't have enough health, otherwise we default to buying damage
            if (getPageSetting('BuyArmor') && (DaThing.Stat == 'health' || DaThing.Stat == 'block') && !enoughHealthE) {
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
                    debug('Leveling equipment ' + eqName, '*upload3');
                    buyEquipment(eqName, null, true);
                }
            }
            if (getPageSetting('BuyArmor') && (DaThing.Stat == 'health') && getPageSetting('AlwaysArmorLvl2') && game.equipment[eqName].level < 2){
                if (DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {             
                    debug('Leveling equipment ' + eqName + " (AlwaysArmorLvl2)", '*upload3');
                    buyEquipment(eqName, null, true);
                } // ??idk??    && (getPageSetting('DelayArmorWhenNeeded') && enoughDamage)
            }
        }
    }
    postBuy();
}

//"Auto Gather/Build"
function manualLabor() {  
    if (game.resources.science.owned > getPlayerModifier() && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
            setGather('metal');
        }
        else {
            setGather('science');
        }
}

//Autostance - function originally created by Belaith (in 1971)
//Automatically swap formations (stances) to avoid dying
function autoStance() {
    //calculate internal script variables.
    //baseDamage
    baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2)*(1+game.goldenUpgrades.Battle.currentBonus));
	baseDamage /= (game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badHealth !== 'undefined')?dailyModifiers.badHealth.getMult(game.global.dailyChallenge.badHealth.strength):1;
	baseDamage *= (game.global.world%2===1&&game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.oddTrimpNerf!== 'undefined')?dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength):1;
    	if (game.global.formation == 0) {
    		baseDamage *= 4;
    	} else if (game.global.formation != "2") {
    	    baseDamage *= 8;
    	}
    	//baseBlock
    	baseBlock = game.global.soldierCurrentBlock;
    	if (game.global.formation == 0) {
        	baseBlock *= 2;
    	} else if (game.global.formation != "3") {
    	    baseBlock *= 8;
    	}
    	//baseHealth
    	baseHealth = game.global.soldierHealthMax;
    	if (game.global.formation == 0) {
        	baseHealth *= 2;
    	} else if (game.global.formation != "1") {
    	    baseHealth *= 8;
    	}

    var ovklHDratio;
    var useoverkill = true; //!!getPageSetting('ScryerUseWhenOverkill');
    if (useoverkill && game.portal.Overkill.level == 0)
        setPageSetting('ScryerUseWhenOverkill',false);
    //Overkill button being on and being able to overkill in S will override any other setting, regardless.
    if (useoverkill && game.portal.Overkill.level > 0) {
        var avgDamage = baseDamage;
        var ovkldmg = avgDamage;
        //are we going to overkill in S?
        ovklHDratio = ovkldmg/(getEnemyMaxHealth(game.global.world,1,true));
        hiderwindow = ovklHDratio;
        Area51i = ovkldmg;
        Area60i = getEnemyMaxHealth(game.global.world,1,true);
        armorValue = ((baseHealth/8)/(getEnemyMaxAttack(game.global.world, 95, 'Snimp',0)*mutations.Corruption.statScale(3)));
        armorTempValue = (game.global.soldierHealth/(getEnemyMaxAttack(game.global.world, 95, 'Snimp',0)*mutations.Corruption.statScale(3)));
        if (hiderwindow > 120) { // && game.global.world < getPageSetting('VoidMaps')
             //enoughDamage = true; enoughHealth = true; shouldFarm = false;
        }
    }
    var badMapHealth = ((game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badMapHealth !== 'undefined')?dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength):1);
    if (game.global.mapsActive && (getCurrentEnemy(1).name == "Jestimp" || getCurrentEnemy(1).name == "Chronoimp" ||  (hiderwindow > (800*0.45*0.12/mutations.Corruption.statScale(10)/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location != "Void"))){ setFormation(4); return;}
    if (game.global.mapsActive && (getCurrentEnemy(1).name != "Jestimp" && getCurrentEnemy(1).name != "Chronoimp" &&  (hiderwindow < (800*0.45*0.12/mutations.Corruption.statScale(10)/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location != "Void"))){ setFormation(2); return;}
    if (game.global.mapsActive && (getCurrentEnemy(1).name == "Jestimp" || getCurrentEnemy(1).name == "Chronoimp" ||  (hiderwindow > (800/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location == "Void"))){ setFormation(4); return;}
    if (!game.global.mapsActive && (hiderwindow > 660)){ setFormation(4); return;}
    
    
    if (game.global.gridArray.length === 0){ return;}
    setFormation(2);
    
    //baseDamage
    baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2));
    
    	if (game.global.formation == 0) {
    		baseDamage *= 2;
    	} else if (game.global.formation != "2") {
    	    baseDamage *= 8;
    	}
    	//baseBlock
    	baseBlock = game.global.soldierCurrentBlock;
    	if (game.global.formation == 0) {
        	baseBlock *= 2;
    	} else if (game.global.formation != "3") {
    	    baseBlock *= 8;
    	}
    	//baseHealth
    	baseHealth = game.global.soldierHealthMax;
    	if (game.global.formation == 0) {
        	baseHealth *= 2;
    	} else if (game.global.formation != "1") {
    	    baseHealth *= 8;
    	}
    //no need to continue
    if (!getPageSetting('AutoStance')) return;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var enemy;
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        if (typeof game.global.gridArray[game.global.lastClearedCell + 1] === 'undefined') {
            enemy = game.global.gridArray[0];
        } else {
            enemy = game.global.gridArray[game.global.lastClearedCell + 1];
        }
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.corrupted) && game.global.challengeActive != "Nom") && game.global.challengeActive != "Coordinate"));
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;   //changed by genBTC from 1.19 (there is no fluctuation)
        //check for world Corruption
        if (enemy.corrupted){
            enemyHealth *= mutations.Corruption.statScale(10);
            enemyDamage *= mutations.Corruption.statScale(3);
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var pierceMod = 0;
        if (game.global.challengeActive == "Lead") pierceMod += (game.challenges.Lead.stacks * 0.001);
        var dDamage = enemyDamage - baseBlock / 2 > enemyDamage * (0.2 + pierceMod) ? enemyDamage - baseBlock / 2 : enemyDamage * (0.2 + pierceMod);
        var dHealth = baseHealth/2;
        var xDamage = enemyDamage - baseBlock > enemyDamage * (0.2 + pierceMod) ? enemyDamage - baseBlock : enemyDamage * (0.2 + pierceMod);
        var xHealth = baseHealth;
        var bDamage = enemyDamage - baseBlock * 4 > enemyDamage * (0.1 + pierceMod) ? enemyDamage - baseBlock * 4 : enemyDamage * (0.1 + pierceMod);
        var bHealth = baseHealth/2;
    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        if (typeof game.global.mapGridArray[game.global.lastClearedMapCell + 1] === 'undefined') {
            enemy = game.global.mapGridArray[0];
        } else {
            enemy = game.global.mapGridArray[game.global.lastClearedMapCell + 1];
        }
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.corrupted) && game.global.challengeActive != "Nom") || game.global.voidBuff == "doubleAttack") && game.global.challengeActive != "Coordinate");
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;   //changed by genBTC from 1.19 (there is no fluctuation)
        //check for voidmap Corruption
        if ((!game.global.preMapsActive && game.global.mapsActive && getCurrentMapObject().location != "Void") && enemy.corrupted){
            enemyHealth *= (mutations.Corruption.statScale(10) / 2).toFixed(1);
            enemyDamage *= (mutations.Corruption.statScale(3) / 2).toFixed(1);
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var dDamage = enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : 0;
        var dVoidCritDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        var dHealth = baseHealth/2;
        var xDamage = enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : 0;
        var xVoidCritDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
        var xHealth = baseHealth;
        var bDamage = enemyDamage - baseBlock * 4 > 0 ? enemyDamage - baseBlock * 4 : 0;
        var bHealth = baseHealth/2;
    }
    
    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    
    if (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse") {
        dDamage+= dHealth * game.global.radioStacks * 0.1;
        xDamage+= xHealth * game.global.radioStacks * 0.1;
        bDamage+= bHealth * game.global.radioStacks * 0.1;
    } else if (drainChallenge) {
        dDamage += dHealth/20;
        xDamage += xHealth/20;
        bDamage += bHealth/20;
    } else if (game.global.challengeActive == "Crushed") {
        if(dHealth > baseBlock /2)
            dDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        if(xHealth > baseBlock)
            xDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
    }
    if (game.global.voidBuff == "bleed" || (enemy && enemy.corrupted == 'corruptBleed')) {
        dDamage += game.global.soldierHealth * 0.2;
        xDamage += game.global.soldierHealth * 0.2;
        bDamage += game.global.soldierHealth * 0.2;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    //double attack is OK if the buff isn't double attack, or we will survive a double attack, or we are going to one-shot them (so they won't be able to double attack)
    var doubleAttackOK = (game.global.voidBuff != 'doubleAttack' || (enemy && enemy.corrupted != 'corruptDbl')) || ((newSquadRdy && dHealth > dDamage * 2) || dHealth - missingHealth > dDamage * 2) || enemyHealth < baseDamage;
    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var leadDamage = game.challenges.Lead.stacks * 0.0005;
    var leadAttackOK = game.global.challengeActive != 'Lead' || enemyHealth < baseDamage || ((newSquadRdy && dHealth > dDamage + (dHealth * leadDamage)) || (dHealth - missingHealth > dDamage + (dHealth * leadDamage)));
    //added voidcrit.
    //voidcrit is OK if the buff isn't crit-buff, or we will survive a crit, or we are going to one-shot them (so they won't be able to crit)
    var isCritVoidMap = game.global.voidBuff == 'getCrit' || (enemy && enemy.corrupted == 'corruptCrit');
    var voidCritinDok = !isCritVoidMap || (!enemyFast ? enemyHealth < baseDamage : false) || (newSquadRdy && dHealth > dVoidCritDamage) || (dHealth - missingHealth > dVoidCritDamage);
    var voidCritinXok = !isCritVoidMap || (!enemyFast ? enemyHealth < baseDamage : false) || (newSquadRdy && xHealth > xVoidCritDamage) || (xHealth - missingHealth > xVoidCritDamage);

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        if (!enemyFast && game.upgrades.Dominance.done && enemyHealth < baseDamage && (newSquadRdy || (dHealth - missingHealth > 0 && !drainChallenge) || (drainChallenge && dHealth - missingHealth > dHealth/20))) {
            setFormation(2);
            //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        } else if (game.upgrades.Dominance.done && ((newSquadRdy && dHealth > dDamage) || dHealth - missingHealth > dDamage) && doubleAttackOK && leadAttackOK && voidCritinDok ) {
            setFormation(2);
            //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritVoidMap && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xVoidCritDamage < game.global.soldierHealthMax/2){
                if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                    setFormation(3);
            }
                //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X. 
                // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xVoidCritDamage == 0 || (game.global.formation == 2 && voidCritinXok)){
                setFormation("0");
            }
                //otherwise, stuff:
            else {
                if (game.global.formation == "0"){
                    if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                        setFormation(3);
                    else
                        setFormation(1);
                }
                else if (game.upgrades.Barrier.done && game.global.formation == 2)
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && ((newSquadRdy && xHealth > xDamage) || xHealth - missingHealth > xDamage)) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && ((newSquadRdy && bHealth > bDamage) || bHealth - missingHealth > bDamage)) {
            setFormation(3);    //does this ever run? 
        } else if (game.upgrades.Formations.done) {
            setFormation(1);
        } else
            setFormation("0");
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp :P
}


var stackingTox = false;
var doVoids = false;
var needToVoid = false;
var needPrestige = false;
var voidCheckPercent = 0;
var HDratio = 0;

var mapYouSlow = false;
var mapYouSlow = document.getElementById('mapYouSlow');
//AutoMap - function originally created by Belaith (in 1971)
//anything/everything to do with maps.
function autoMap() {
    //allow script to handle abandoning
    if(game.options.menu.alwaysAbandon.enabled == 1) toggleSetting('alwaysAbandon');
    //if we are prestige mapping, force equip first mode
    if(autoTrimpSettings.Prestige.selected != "Off" && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    //if player has selected arbalest or gambeson but doesn't have them unlocked, just unselect it for them! It's magic!
    if(document.getElementById('Prestige').selectedIndex > 11 && game.global.slowDone == false) {
       // document.getElementById('Prestige').selectedIndex = 11;
        //autoTrimpSettings.Prestige.selected = "Bestplate";
    }    
    //Control in-map right-side-buttons for people who can't control themselves. If you wish to use these buttons manually, turn off autoMaps temporarily.
    if(game.options.menu.repeatUntil.enabled == 2) toggleSetting('repeatUntil');
    if(game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if(game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    //exit and do nothing if we are prior to zone 6 (maps haven't been unlocked):
    if (!game.global.mapsUnlocked) {        
        enoughDamage = true; enoughHealth = true; shouldFarm = false;
        return;
    }
    //FIND VOID MAPS LEVEL:
    var voidMapLevelSetting = getPageSetting('VoidMaps');
    //decimal void maps are possible, using string function to avoid false float precision (0.29999999992). javascript can compare ints to strings anyway.
    var voidMapLevelSettingZone = (voidMapLevelSetting+"").split(".")[0];
    var voidMapLevelSettingMap = (voidMapLevelSetting+"").split(".")[1];
    if (voidMapLevelSettingMap === undefined || game.global.challengeActive == 'Lead') 
        voidMapLevelSettingMap = 0; // 93
    if (voidMapLevelSettingMap.length == 1) voidMapLevelSettingMap += "0";  //entering 187.70 becomes 187.7, this will bring it back to 187.70
    var voidsuntil = getPageSetting('RunNewVoidsUntil');
    var badMapHealth = ((game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badMapHealth !== 'undefined')?dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength):1);
    needToVoid = voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingMap && 
                                ((game.global.world == voidMapLevelSettingZone && !getPageSetting('RunNewVoids')) 
                                                                || 
                                 (game.global.world >= voidMapLevelSettingZone && getPageSetting('RunNewVoids'))||hiderwindow < 15*badMapHealth)
                         && ((voidsuntil != -1 && game.global.world <= voidsuntil) || (voidsuntil == -1) || !getPageSetting('RunNewVoids'));
    if(game.global.totalVoidMaps == 0 || !needToVoid)
        doVoids = false;
    //calculate if we are behind on prestiges
    needPrestige = (autoTrimpSettings.Prestige.selected != "Off" && game.mapUnlocks[autoTrimpSettings.Prestige.selected].last <= game.global.world - 5 && game.global.mapsUnlocked && game.global.challengeActive != "Frugal");
    
//START CALCULATING DAMAGES
    //PREPARE SOME VARIABLES
    //calculate crits (baseDamage was calced in function autoStance)
    baseDamage = (baseDamage * (1-getPlayerCritChance()) + (baseDamage * getPlayerCritChance() * getPlayerCritDamageMult()));
    //calculate with map bonus
    var mapbonusmulti = 1 + (0.20*game.global.mapBonus);
    baseDamage *= mapbonusmulti;    
    //get average enemyhealth and damage for the next zone, cell 30, snimp type and multiply it by a factor of .85 (don't ask why)
    var enemyDamage = getEnemyMaxAttack(game.global.world + 1, 30, 'Snimp', .85);
    var enemyHealth = getEnemyMaxHealth(game.global.world + 1);    
    //farm if basedamage is between 10 and 16)
    if(!getPageSetting('DisableFarm')) {
        shouldFarm = shouldFarm ? getEnemyMaxHealth(game.global.world) / baseDamage > 10 : getEnemyMaxHealth(game.global.world) / baseDamage > 16;
    }    
    var pierceMod = 0;
    enoughHealth = (baseHealth * 4 > 30 * (enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : enemyDamage * (0.2 + pierceMod))
                    || 
                    baseHealth > 30 * (enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : enemyDamage * (0.2 + pierceMod)));
    enoughDamage = baseDamage * 4 > enemyHealth;
    HDratio = getEnemyMaxHealth(game.global.world) / baseDamage;
    //prevents map-screen from flickering on and off during startup when base damage is 0.
    if (baseDamage > 0){
        //var shouldDoMaps = !enoughHealth || !enoughDamage || shouldFarm;
    }
    var selectedMap = "world";       
    
//BEGIN AUTOMAPS DECISIONS:
    //if we are at max map bonus, and we don't need to farm, don't do maps
    if(game.global.mapBonus == 10 && !shouldFarm) shouldDoMaps = false;
    //stack tox stacks if heliumGrowing has been set to true, or if we need to clear our void maps
    else stackingTox = false;
    //during 'watch' challenge, run maps on these levels:
    var watchmaps = [15,25,35,50];
    var shouldDoWatchMaps = false;
    if (getPageSetting('BuyBuildings')) {
    	
	//mapYouSlow maps
        var mapYouSlow = false;
        var cellClearTime = 540;
        OVKcellsWorld = document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
        if (game.portal.Overkill.level > 3) {
        	cellClearTime /= 2
        }
        if (game.talents.hyperspeed.purchased) {
        	cellClearTime -= 50
        }
        //levels of new Giga
        var stationLevel = [61,62,63,64,65,66,67,68,69,70,72,74,76,78,81,84,87,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,190,200,210,220,230,240,250,260,270,280,290,300];
        if (
        
        ((game.global.mapBonus < 10 && hiderwindow < 0.0275 ) || (game.global.mapBonus < 9 && hiderwindow < 0.03 ) || (game.global.mapBonus < 8 && hiderwindow < 0.036 ) || (game.global.mapBonus < 7 && hiderwindow < 0.05 ) || (game.global.mapBonus < 6 && hiderwindow < 0.08 ) || (game.global.mapBonus < 5 && hiderwindow < 0.13 ) || (game.global.mapBonus < 4 && hiderwindow <0.2 ) || (game.global.mapBonus < 3 && hiderwindow < 0.5 ) || (game.global.mapBonus < 2 && hiderwindow < 0.75 ) || (game.global.mapBonus < 1 && hiderwindow < 100 && game.global.lastClearedCell<31 ) || (game.global.mapBonus < 1 && hiderwindow < 10 && game.global.lastClearedCell<51 )))
        //(game.global.mapsActive && getBreedTime(true) > 0 && hiderwindow < 1)	//Stay in maps to heal
        //(game.global.world >= 310 && ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < 10)	//option to force stay in zone X time in min/cleared maps and farm
        //(game.global.world == 200 && game.global.lastClearedCell > 20 && ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < 10)		//option to force stay in zone X time in min and farm		
	 {		
        shouldDoMaps = true;		
        mapYouSlow = true;		
        console.log("now walking mapYouSlow = true");		
        }		
    }

    var shouldDoSpireMaps = false;
    var needFarmSpire = (((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire')) && game.global.mapBonus == 10;
    //Farm X Minutes Before Spire:
    //Dynamic Siphonology section (when necessary)
    var siphlvl = game.global.world - game.portal.Siphonology.level;
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    if (getPageSetting('DynamicSiphonology')){
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl);
            if (baseDamage * 2 < maphp){
                break;
            }
        }
    }
    var obj = {};
    var siphonMap = -1;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) {
            obj[map] = game.global.mapsOwnedArray[map].level;
            if(game.global.mapsOwnedArray[map].level == siphlvl)
                siphonMap = map;                
        }
    }
    var keysSorted = Object.keys(obj).sort(function(a, b) {
        return obj[b] - obj[a];
    });
    //if there are no non-unique maps, there will be nothing in keysSorted, so set to create a map
    if (keysSorted[0]) var highestMap = keysSorted[0];
    else selectedMap = "create";
    
    //voidArray: make an array with all our voidmaps, so we can sort them by real-world difficulty level
    var voidArray = [];
    //values are easiest to hardest. (hardest has the highest value)
    var prefixlist = {'Deadly':30, 'Heinous':31, 'Poisonous':5, 'Destructive':10}; //{'Deadly':10, 'Heinous':11, 'Poisonous':20, 'Destructive':30};
    var prefixkeys = Object.keys(prefixlist);
    var suffixlist = {'Descent':10.6, 'Void':9.436, 'Nightmare':8.822, 'Pit':7.077}; //{'Descent':7.077, 'Void':8.822, 'Nightmare':9.436, 'Pit':10.6};
    var suffixkeys = Object.keys(suffixlist);
    for (var map in game.global.mapsOwnedArray) {
        var theMap = game.global.mapsOwnedArray[map];
        if(theMap.location == 'Void') {
            for (var pre in prefixkeys) { 
                if (theMap.name.includes(prefixkeys[pre]))
                    theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]]; 
            }
            for (var suf in suffixkeys) { 
                if (theMap.name.includes(suffixkeys[suf]))
                    theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]]; 
            }
            voidArray.push(theMap);
        }
    }
    //sort the array (harder/highvalue last):
    var voidArraySorted = voidArray.sort(function(a, b) {
        return a.sortByDiff - b.sortByDiff;
    });
    for (var map in voidArraySorted) {
        var theMap = voidArraySorted[map];
        //Only proceed if we needToVoid right now.
        if(needToVoid) {
            //if we are on toxicity, don't clear until we will have max stacks at the last cell.
            if(game.global.challengeActive == 'Toxicity' && game.challenges.Toxicity.stacks < (1500 - theMap.size)) break;
            doVoids = true;
            //check to make sure we won't get 1-shot in nostance by boss
            var eAttack = getEnemyMaxAttack(game.global.world, theMap.size, 'Voidsnimp', theMap.difficulty);
            if (game.global.world >= 181 || (game.global.challengeActive == "Corrupted" && game.global.world >= 60))
                eAttack *= (mutations.Corruption.statScale(3) / 2).toFixed(1);
            var ourHealth = baseHealth;
            if(game.global.challengeActive == 'Balance') {
                var stacks = game.challenges.Balance.balanceStacks ? (game.challenges.Balance.balanceStacks > theMap.size) ? theMap.size : game.challenges.Balance.balanceStacks : false;
                eAttack *= 2;
                if(stacks) {
                    for (i = 0; i < stacks; i++ ) {
                        ourHealth *= 1.01;
                    }
                }
            }
            if(game.global.challengeActive == 'Toxicity') eAttack *= 5;
            //break to prevent finishing map to finish a challenge?
            //continue to check for doable map?
            var diff = parseInt(getPageSetting('VoidCheck')) > 0 ? parseInt(getPageSetting('VoidCheck')) : 2;
            if(ourHealth/diff < eAttack - baseBlock) {
                shouldFarm = true;
                voidCheckPercent = Math.round((ourHealth/diff)/(eAttack-baseBlock)*100);
                break;
            }
            else {
                voidCheckPercent = 0;
                if(getPageSetting('DisableFarm'))
                    shouldFarm = false;
            }
            selectedMap = theMap.id;
            //Restart the voidmap if we hit 30 nomstacks on the final boss
            if(game.global.mapsActive && game.global.challengeActive == "Nom" && getPageSetting('FarmWhenNomStacks7')) {
                if(game.global.mapGridArray[theMap.size-1].nomStacks >= 100) {
                    mapsClicked(true);
                }
            }
            break;
        }
    }

    //map if we don't have health/dmg or we need to clear void maps or if we are prestige mapping, and our set item has a new prestige available 
    if (mapYouSlow || doVoids) {
        //selectedMap = world here if we haven't set it to create yet, meaning we found appropriate high level map, or siphon map
        if (selectedMap == "world") {
            //if needPrestige, TRY to find current level map as the highest level map we own.
            if (needPrestige||mapYouSlow )
                if (game.global.world-1 <= game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].level&&26>=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].size)
                    selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id;
                else
                    selectedMap = "create";
            //if needFarmSpire x minutes is true, switch over from wood maps to metal maps.    
            else if (needFarmSpire)
                if (game.global.mapsOwnedArray[highestMap].location == "Plentiful") //Mountain
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
            //if shouldFarm is true, use a siphonology adjusted map, as long as we aren't trying to prestige                                
            else if (siphonMap != -1)
                selectedMap = game.global.mapsOwnedArray[siphonMap].id;
            //if we dont' have an appropriate max level map, or a siphon map, we need to make one
            else
                selectedMap = "create";
        }
        //if selectedMap != world, it already has a map ID and will be run below            
    }
    //Repeat Button Management (inside a map):
    if (!game.global.preMapsActive && game.global.mapsActive) {
        //Set the repeatBionics flag (farm bionics before spire), for the repeat button management code.
        var repeatBionics = getPageSetting('RunBionicBeforeSpire') && game.global.bionicOwned >= 5;
        //if we are doing the right map, and it's not a norecycle (unique) map, and we aren't going to hit max map bonus
        //or repeatbionics is true and there are still prestige items available to get
        if (selectedMap == game.global.currentMapId && (!getCurrentMapObject().noRecycle && (game.global.mapBonus < 10)) || (repeatBionics && addSpecials(true, true, getCurrentMapObject()) > 0)) {
            var targetPrestige = autoTrimpSettings.Prestige.selected;
            //make sure repeat map is on
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            //if we aren't here for dmg/hp, and we see the prestige we are after on the last cell of this map, and it's the last one available, turn off repeat to avoid an extra map cycle
            if (!shouldDoMaps && (game.global.mapGridArray[game.global.mapGridArray.length - 1].special == targetPrestige && game.mapUnlocks[targetPrestige].last >= game.global.world - 9 )) {
                repeatClicked();
            }
            if (
        (!((game.global.mapBonus+1 < 10 && hiderwindow < 0.0275 ) || (game.global.mapBonus+1 < 9 && hiderwindow < 0.03 ) || (game.global.mapBonus+1 < 8 && hiderwindow < 0.036 ) || (game.global.mapBonus+1 < 7 && hiderwindow < 0.05 ) || (game.global.mapBonus+1 < 6 && hiderwindow < 0.08 ) || (game.global.mapBonus+1 < 5 && hiderwindow < 0.13 ) || (game.global.mapBonus+1 < 4 && hiderwindow < 0.2 ) || (game.global.mapBonus+1 < 3 && hiderwindow < 0.5 ) || (game.global.mapBonus+1 < 2 && hiderwindow < 0.75 )))){
        	repeatClicked();
        }
       } else {
            //otherwise, make sure repeat map is off
            if (game.global.repeatMap) {
                repeatClicked();
            }
        }
    //clicks the maps button, once or twice (inside the world):
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            //if we should not be in the world, and the button is not already clicked, click map button once (and wait patiently until death)
            if (!game.global.switchToMaps){
                mapsClicked();
            }
            //Get Impatient/Abandon if: (need prestige / _NEED_ to do void maps / on lead in odd world.) AND (a new army is ready, OR _need_ to void map OR lead farming and we're almost done with the zone)
            if(
                game.global.switchToMaps 
                && 
                (doVoids || (game.global.challengeActive == 'Lead' && game.global.world % 2 == 1)) 
                && 
                    (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1)
                    || (game.global.challengeActive == 'Lead' && game.global.lastClearedCell > 93) 
                    || (doVoids && (game.global.lastClearedCell > 93 || getPageSetting('VoidMaps') > 350))
                    )
                ){
                mapsClicked();
            }
        }
        //forcibly run watch maps
        if (shouldDoWatchMaps || ((game.global.lastBreedTime >= 30000||getBreedTime(true)==0) && mapYouSlow)) {
            mapsClicked();
        }
    } else if (game.global.preMapsActive) {
        if (selectedMap == "world") {
            mapsClicked();  //go back
        } 
        else if (selectedMap == "create") { 
            if (false)
                document.getElementById("mapLevelInput").value = game.global.world;
            else if (mapYouSlow){
            	document.getElementById("mapLevelInput").value = game.global.world-1;
            }
            else
                document.getElementById("mapLevelInput").value = siphlvl;
            if (game.global.world == 200 && game.global.spireActive) {
                sizeAdvMapsRange.value = 9;
                adjustMap('size', 9);
                difficultyAdvMapsRange.value = 9;
                adjustMap('difficulty', 9);
                lootAdvMapsRange.value = 9;
                adjustMap('loot', 9);
                
                biomeAdvMapsSelect.value = "Plentiful"; //Mountain
                updateMapCost();                
            } else if (game.global.world > 60) {
                sizeAdvMapsRange.value = 9;
                adjustMap('size', 9);
                difficultyAdvMapsRange.value = 9;
                adjustMap('difficulty', 9);
                lootAdvMapsRange.value = 9;
                adjustMap('loot', 9);

                biomeAdvMapsSelect.value = "Plentiful"; //Mountain
                updateMapCost();
            } else if (game.global.world < 16) {
                sizeAdvMapsRange.value = 9;
                adjustMap('size', 9);
                difficultyAdvMapsRange.value = 9;
                adjustMap('difficulty', 9);
                lootAdvMapsRange.value = 9;
                adjustMap('loot', 9);

                biomeAdvMapsSelect.value = "Plentiful"; //Sea
                updateMapCost();
            } else {
                sizeAdvMapsRange.value = 9;
                adjustMap('size', 9);
                difficultyAdvMapsRange.value = 9;
                adjustMap('difficulty', 9);
                lootAdvMapsRange.value = 9;
                adjustMap('loot', 9);

                biomeAdvMapsSelect.value = "Plentiful"; //Sea
                updateMapCost();
            }
            //if we are "Farming" for resources, make sure it's metal
            if(game.global.world > 90 && (shouldFarm || needFarmSpire)) {
                biomeAdvMapsSelect.value = "Plentiful"; //Mountain
            } else {
                //if we can't afford the map:
                //Put a priority on small size, and increase the difficulty? for high Helium that just wants prestige = yes.
                //Really just trying to prevent prestige mapping from getting stuck
                while (difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                    difficultyAdvMapsRange.value -= 1;
                }
            }
            //Common:
            //if we still cant afford the map, lower the size slider (make it larger) (doesn't matter much for farming.)
            while (sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            //if we STILL cant afford the map, lower the loot slider (less loot)
            while (lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            //if we can't afford the map we designed, pick our highest existing map
            if (updateMapCost(true) > game.resources.fragments.owned) {
                selectMap(game.global.mapsOwnedArray[highestMap].id);
                debug("Can't afford the map we designed, #" + document.getElementById("mapLevelInput").value, '*crying2');
                debug("..picking our highest map:# " + game.global.mapsOwnedArray[highestMap].id + " Level: " + game.global.mapsOwnedArray[highestMap].level, '*happy2');
                runMap();
            } else {
            	while (true){
                debug("BUYING a Map, level: #" + document.getElementById("mapLevelInput").value, 'th-large');
                var result = buyMap();
                if(result == -2){
                    debug("Too many maps, recycling now: ", 'th-large');
                    document.getElementById("mapLevelInput").value = game.global.world;
                    recycleBelow(true);
                    document.getElementById("mapLevelInput").value = game.global.world-1;
                    debug("Retrying BUYING a Map, level: #" + document.getElementById("mapLevelInput").value, 'th-large');
                    buyMap();
                }
                if (26>=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].size){
                    break;
                }
            }
            selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id;
            selectMap(selectedMap);
            runMap();
            //if we already have a map picked, run it
        }} else {
            selectMap(selectedMap);
            debug("Already have a map picked: Running map: " + selectedMap + 
                " Level: " + game.global.mapsOwnedArray[getMapIndex(selectedMap)].level +
                " Name: " + game.global.mapsOwnedArray[getMapIndex(selectedMap)].name, 'th-large');
            runMap();
        }
    }
}

/*
unused. rudimentary.
//calculate helium we will get from the end of this zone. If (stacks), return helium we will get with max tox stacks
function calculateHelium (stacks) {
    var world = game.global.world;
    var level = 100 + ((world - 1) * 100);
    var amt = 0;
    var baseAmt;
    
    if(world < 59) baseAmt = 1;
    else baseAmt = 5;
    
    level = Math.round((level - 1900) / 100);
    level *= 1.35;
    if(level < 0) level = 0;
    amt += Math.round(baseAmt * Math.pow(1.23, Math.sqrt(level)));
    amt += Math.round(baseAmt * level);
    
    if (game.portal.Looting.level) amt += (amt * game.portal.Looting.level * game.portal.Looting.modifier);
    if (game.portal.Looting_II.level) amt += (amt * game.portal.Looting_II.level * game.portal.Looting_II.modifier);    //added
    
    if (game.global.challengeActive == "Toxicity"){
        var toxMult = (game.challenges.Toxicity.lootMult * game.challenges.Toxicity.stacks) / 100;
        if(toxMult > 2.25 || stacks) toxMult = 2.25;
        amt *= (1 + toxMult);
    }
    amt = Math.floor(amt);
    return amt;
}
//calculate our helium per hour including our helium for the end of this zone, assuming we finish the zone right now (and get that helium right now)
//if (stacked), calculate with maximum toxicity stacks
function calculateNextHeliumHour (stacked) {
    var timeThisPortal = new Date().getTime() - game.global.portalTime;
    timeThisPortal /= 3600000;
    var heliumNow = Math.floor((game.resources.helium.owned + calculateHelium()) / timeThisPortal);
    if(stacked) heliumNow = Math.floor((game.resources.helium.owned + calculateHelium(true)) / (timeThisPortal + (1500 - game.challenges.Toxicity.stacks) / 7200000));
    return heliumNow;
}
*/

var lastHeliumZone = 0;
//Decide When to Portal
function autoPortal() {
    switch (autoTrimpSettings.AutoPortal.selected) {
        //portal if we have lower He/hr than the previous zone (or buffer)
        case "Helium Per Hour":
            //if (game.global.lastClearedCell >= 1  && game.global.lastClearedCell <= 10) {
            //var bestHeHr = game.stats.bestHeliumHourThisRun.storedValue;
            //}
            game.stats.bestHeliumHourThisRun.evaluate();    //normally, evaluate() is only called once per second, but the script runs at 10x a second.
            if(game.global.world > lastHeliumZone) {
                lastHeliumZone = game.global.world;
                if(game.global.world > game.stats.bestHeliumHourThisRun.atZone) {
                    var bestHeHr = game.stats.bestHeliumHourThisRun.storedValue;
                    var myHeliumHr = game.stats.heliumHour.value();
                    var heliumHrBuffer = Math.abs(getPageSetting('HeliumHrBuffer'));
                    if(game.global.challengeActive!="Daily"&&myHeliumHr < bestHeHr * (1-(heliumHrBuffer/100)) && !game.global.challengeActive && (hiderwindow < 0.1) ) {
                        debug("My Helium was: " + myHeliumHr + " & the Best Helium was: " + bestHeHr + " at zone: " +  game.stats.bestHeliumHourThisRun.atZone);
                        pushData();
                        if(autoTrimpSettings.HeliumHourChallenge.selected != 'None')
                            doPortal(autoTrimpSettings.HeliumHourChallenge.selected);
                        else 
                            doPortal();
                    }
                }
            }
            break;
        case "Custom":
            if(game.global.world > getPageSetting('CustomAutoPortal') && !game.global.challengeActive) {
                pushData();
                if(autoTrimpSettings.HeliumHourChallenge.selected != 'None')
                    doPortal(autoTrimpSettings.HeliumHourChallenge.selected);
                else
                    doPortal();
            }
            break; 
        case "Balance":
        case "Electricity":
        case "Crushed":
        case "Nom":
        case "Toxicity":
        case "Watch":
        case "Lead":
        case "Corrupted":
            if(!game.global.challengeActive) {
                pushData();
                doPortal(autoTrimpSettings.AutoPortal.selected);
            }
            break;
        default:
            break;
    }
}

//Checks portal related UI settings (TODO: split into two, and move the validation check to NewUI)
function checkSettings() {
    var portalLevel = -1;
    var leadCheck = false;
    switch(autoTrimpSettings.AutoPortal.selected) {
        case "Off":
            break;
        case "Custom":
            portalLevel = autoTrimpSettings.CustomAutoPortal.value + 1;
            leadCheck = autoTrimpSettings.HeliumHourChallenge.selected == "Lead" ? true:false;
            break;
        case "Balance":
            portalLevel = 41;
            break;
        case "Electricity":
            portalLevel = 82;
            break;
        case "Crushed":
            portalLevel = 126;
            break;
        case "Nom":
            portalLevel = 146;
            break;
        case "Toxicity":
            portalLevel = 166;
            break;
        case "Lead":
            portalLevel = 181;
            break;
        case "Watch":
            portalLevel = 181;
            break;
        case "Corrupted":
            portalLevel = 191;
            break;
    }
    if(portalLevel == -1)
        return portalLevel;
    if(autoTrimpSettings.VoidMaps.value >= portalLevel)
        tooltip('confirm', null, 'update', 'WARNING: Your void maps are set to complete after your autoPortal, and therefore will not be done at all! Please Change Your Settings Now. This Box Will Not Go away Until You do. Remember you can choose \'Custom\' autoPortal along with challenges for complete control over when you portal. <br><br> Estimated autoPortal level: ' + portalLevel , 'cancelTooltip()', 'Void Maps Conflict');
    if((leadCheck || game.global.challengeActive == 'Lead') && (autoTrimpSettings.VoidMaps.value % 2 == 0 && portalLevel < 182))
        tooltip('confirm', null, 'update', 'WARNING: Voidmaps run during Lead on an Even zone do not receive the 2x Helium Bonus for Odd zones, and are also tougher. You should probably fix this.', 'cancelTooltip()', 'Lead Challenge Void Maps');
    return portalLevel;
}

//Actually Portal.
function doPortal(challenge) {
    if(!game.global.portalActive) return;
    portalClicked();
    if(challenge) selectChallenge(challenge);
    activateClicked();
    activatePortal();
    lastHeliumZone = 0;
    pastUpgradesBtn = viewPortalUpgrades();
    activatePortalBtn = activateClicked();
}

//Controls "Manage Breed Timer" and "Genetecist Timer" - adjust geneticists to reach desired breed timer


//Change prestiges as we go (original idea thanks to Hider)
//The idea is like this. We will stick to Dagger until the end of the run, then we will slowly start grabbing prestiges, so we can hit the Prestige we want by the last zone.
//The keywords below "Dagadder" and "GambesOP" are merely representative of the minimum and maximum values. Toggling these on and off, the script will take care of itself, when set to min (Dagger) or max (Gambeson).
//In this way, we will achieve the desired "maxPrestige" setting (which would be somewhere in the middle, like Polearm) by the end of the run. (instead of like in the past where it was gotten from the beginning and wasting time in early maps.)
//Function originally written by Hyppy (in July 2016)
function prestigeChanging2(){
     //find out the equipment index of the prestige we want to hit at the end.
     var maxPrestigeIndex = document.getElementById('Prestige').selectedIndex;
    // Cancel dynamic prestige logic if maxPrestigeIndex is less than or equal to 2 (dagger)
    if (maxPrestigeIndex <= 2)
        return;
        
     //find out the last zone (checks custom autoportal and challenge's portal zone)
     var lastzone = checkSettings() - 1; //subtract 1 because the function adds 1 for its own purposes.
     
     //if we can't figure out lastzone (likely Helium per Hour AutoPortal setting), then use the last run's Portal zone.
     if (lastzone < 0)
         lastzone = game.global.lastPortal;
     
    // Find total prestiges needed by determining current prestiges versus the desired prestiges by the end of the run
    var neededPrestige = 0;
    for (i = 1; i <= maxPrestigeIndex ; i++){
        var lastp = game.mapUnlocks[autoTrimpSettings.Prestige.list[i]].last;
        if (lastp <= lastzone){
            var addto = Math.ceil((lastzone + 1 - lastp)/5);
            // For Scientist IV bonus, halve the required prestiges to farm
            if (game.global.sLevel > 3)
                addto += Math.ceil(addto/2);
            neededPrestige += addto;                
        }
    }
    // For Lead runs, we hack this by doubling the neededPrestige to acommodate odd zone-only farming. This might overshoot a bit
    if (game.global.challengeActive == 'Lead')  
        neededPrestige *= 2;
    
    // Determine the number of zones we want to farm.  We will farm 4 maps per zone, then ramp up to 9 maps by the final zone
    var zonesToFarm = 0;
    if (neededPrestige == 0){
        autoTrimpSettings.Prestige.selected = "Dagadder";
        return;
    }
    else if (neededPrestige <= 9)//next 9
        zonesToFarm = 1;
    else if (neededPrestige <= 17)//next 8
        zonesToFarm = 2;
    else if (neededPrestige <= 24)//next 7
        zonesToFarm = 3;
    else if (neededPrestige <= 30)//next 6
        zonesToFarm = 4;
    else if (neededPrestige <= 35)//next 5
        zonesToFarm = 5;
    else
        zonesToFarm = 6 + Math.ceil((neededPrestige - 35)/5);
 
    //If we are in the zonesToFarm threshold, kick off the prestige farming
    if(game.global.world > (lastzone-zonesToFarm) && game.global.lastClearedCell < 79){
        // Default map bonus threshold
        var mapThreshold = 4;
        var zonegap = lastzone - game.global.world;
        if (zonegap <= 4)// Would be +5 but the map repeat button stays on for 1 extra.
            mapThreshold += zonegap;

        if (game.global.mapBonus < mapThreshold)
             autoTrimpSettings.Prestige.selected = "GambesOP";
         else if (game.global.mapBonus >= mapThreshold)
             autoTrimpSettings.Prestige.selected = "Dagadder";
    }
            
    //If we are not in the prestige farming zone (the beginning of the run), use dagger:
    if (game.global.world <= lastzone-zonesToFarm || game.global.mapBonus == 10)  
     autoTrimpSettings.Prestige.selected = "Dagadder";
}

//Activate Robo Trimp
function autoRoboTrimp() {
    //exit if the cooldown is active, or we havent unlocked robotrimp.
    if (game.global.roboTrimpCooldown > 0 || !game.global.roboTrimpLevel) return;
    var robotrimpzone = parseInt(getPageSetting('AutoRoboTrimp'));
    //exit if we have the setting set to 0
    if (robotrimpzone == 0) return;
    //activate the button when we are above the cutoff zone, and we are out of cooldown (and the button is inactive)
    if (game.global.world >= robotrimpzone && !game.global.useShriek){
        magnetoShriek();
        debug("Activated Robotrimp Ability", '*podcast');
    }
}

//Version 3.6 Golden Upgrades
function autoGoldenUpgrades() {
    //get the numerical value of the selected index of the dropdown box
    var setting = document.getElementById('AutoGoldenUpgrades').value;
    if (setting == "Off") return;   //if disabled, exit.
    var num = getAvailableGoldenUpgrades();
    if (num == 0) return;       //if we have nothing to buy, exit.
    if (game.global.world>=599&&game.global.world<=7771){
     	buyGoldenUpgrade("Battle");
     }
    buyGoldenUpgrade(setting);
}

//Handles manual fighting automatically, in a different way.
function betterAutoFight() {
    //Manually fight instead of using builtin auto-fight
    if (game.global.autoBattle) {
        if (!game.global.pauseFight) {
            //pauseFight(); //Disable autofight
        }
    }
    lowLevelFight = game.resources.trimps.maxSoldiers < (game.resources.trimps.owned - game.resources.trimps.employed) * 0.5 && (game.resources.trimps.owned - game.resources.trimps.employed) > game.resources.trimps.realMax() * 0.1 && game.global.world < 5 && game.global.sLevel > 0;
    if (game.upgrades.Battle.done && !game.global.fighting && game.global.gridArray.length !== 0 && !game.global.preMapsActive && (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1 || game.global.soldierHealth > 0 || lowLevelFight || game.global.challengeActive == 'Watch')) {
        fightManual();
    }
    //Click Fight if we are dead and already have enough for our breed timer, and fighting would not add a significant amount of time
    if (!game.global.fighting && getBreedTime() < 2 && (game.global.lastBreedTime/1000) > autoTrimpSettings.GeneticistTimer.value && game.global.soldierHealth == 0)
        fightManual();
}

//Exits the Spire after completing the specified cell.
function exitSpireCell() {    
    if(game.global.world == 200 && game.global.spireActive && game.global.lastClearedCell >= getPageSetting('ExitSpireCell')-1) 
        endSpire();    
}

//use S stance
function useScryerStance() {
	
    	//Scryer if Overkill
    	//calculate internal script variables normally processed by autostance.
    	//baseDamage
    	baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2)*(1+game.goldenUpgrades.Battle.currentBonus));
	baseDamage /= (game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badHealth !== 'undefined')?dailyModifiers.badHealth.getMult(game.global.dailyChallenge.badHealth.strength):1;
	baseDamage *= (game.global.world%2===1&&game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.oddTrimpNerf!== 'undefined')?dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength):1;
    	if (game.global.formation == 0) {
    		baseDamage *= 4;
    	} else if (game.global.formation != "2") {
    	    baseDamage *= 8;
    	}
    	//baseBlock
    	baseBlock = game.global.soldierCurrentBlock;
    	if (game.global.formation == 0) {
        	baseBlock *= 2;
    	} else if (game.global.formation != "3") {
    	    baseBlock *= 8;
    	}
    	//baseHealth
    	baseHealth = game.global.soldierHealthMax;
    	if (game.global.formation == 0) {
        	baseHealth *= 2;
    	} else if (game.global.formation != "1") {
    	    baseHealth *= 8;
    	}
    var ovklHDratio;
    var useoverkill = true; //!!getPageSetting('ScryerUseWhenOverkill');
    if (useoverkill && game.portal.Overkill.level == 0)
        setPageSetting('ScryerUseWhenOverkill',false);
    //Overkill button being on and being able to overkill in S will override any other setting, regardless.
    if (useoverkill && game.portal.Overkill.level > 0) {
        var avgDamage = baseDamage;
        var ovkldmg = avgDamage;
        //are we going to overkill in S?
        ovklHDratio = ovkldmg/(getEnemyMaxHealth(game.global.world,1,true));
        hiderwindow = ovklHDratio;
        Area51i = ovkldmg;
        Area60i = getEnemyMaxHealth(game.global.world,1,true);
        armorValue = ((baseHealth/8)/(getEnemyMaxAttack(game.global.world, 95, 'Snimp',0)*mutations.Corruption.statScale(3)));
        armorTempValue = (game.global.soldierHealth/(getEnemyMaxAttack(game.global.world, 95, 'Snimp',0)*mutations.Corruption.statScale(3)));
        if (hiderwindow > 120) { // && game.global.world < getPageSetting('VoidMaps')
             //enoughDamage = true; enoughHealth = true; shouldFarm = false;
        }
    //quit here if its right
    }
    if (game.global.preMapsActive || (!game.global.preMapsActive && game.global.mapsActive && getCurrentMapObject().location == "Void") || hiderwindow < 20 || HDratio > 7 || (game.global.spireActive && game.global.lastClearedCell > 77) || game.global.gridArray.length === 0 || game.global.highestLevelCleared < 180 || (hiderwindow < 20 && game.global.lastClearedCell == 98)) { autoStance(); return;
    }
    //if (ovklHDratio > 0.9) {
      //  setFormation(4);
        //return;
    //}

    //grab settings variables
    var useinmaps = getPageSetting('ScryerUseinMaps');
    var useinvoids = getPageSetting('ScryerUseinVoidMaps');
    var useinspire = getPageSetting('ScryerUseinSpire');
    //var useinspiresafes = getPageSetting('ScryerUseinSpireSafes');
    var minzone = getPageSetting('ScryerMinZone');
    var maxzone = getPageSetting('ScryerMaxZone');
    
    //decide if we are going to use it.
    var mapcheck = game.global.mapsActive;
    var run = !mapcheck;    //initially set run with the opposite of "are we in a map" (if false, run will be true which means "run if we are in world")
    if (mapcheck) {
        //if we are in a map, set to check if he wants to use S in maps.
        run = useinmaps;
        //if we are in a void, set to check if he wants to use S in voids.
        if (!game.global.preMapsActive && game.global.mapsActive && getCurrentMapObject().location != "Void")
            run = useinvoids;
    }
    else {
        //if we aren't in a map, are we in spire? if not, just go with run in world.
        var spirecheck = (game.global.world == 200 && game.global.spireActive);
        run = spirecheck ? useinspire : run;
    }
    if ((!game.global.mapsActive && !game.global.preMapsActive && game.global.gridArray.length > 0 && ((hiderwindow == 20 && game.global.lastClearedCell == 98) || game.global.lastClearedCell < 98)) && ((!getCurrentEnemy(1).corrupted && hiderwindow > 20) ||
    	(!getCurrentEnemy(2).corrupted && 4*baseDamage*getPlayerCritDamageMult() > getCurrentEnemy().health/2 && hiderwindow > 20))) {
    	setFormation(4);
    	return;
    }
    if (game.global.mapsActive && run == true && game.global.world >= 60 && (game.global.world >= minzone || minzone <= 0) && (game.global.world < maxzone || maxzone <= 0)) {
        setFormation(4);    //set the S stance
        //calculate internal script variables normally processed by autostance.
        
        //baseDamage
    	baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2));
    	if (game.global.formation == 0) {
    		baseDamage *= 2;
    	} else if (game.global.formation != "2") {
    	    baseDamage *= 8;
    	}
    	//baseBlock
    	baseBlock = game.global.soldierCurrentBlock;
    	if (game.global.formation == 0) {
        	baseBlock *= 2;
    	} else if (game.global.formation != "3") {
    	    baseBlock *= 8;
    	}
    	//baseHealth
    	baseHealth = game.global.soldierHealthMax;
    	if (game.global.formation == 0) {
        	baseHealth *= 2;
    	} else if (game.global.formation != "1") {
    	    baseHealth *= 8;
    	}
    } else {
        autoStance();    //falls back to autostance when not using S. 
    }
}

////////////////////////////////////////
//Main DELAY Loop///////////////////////
////////////////////////////////////////

setTimeout(delayStart, startupDelay);
function delayStart() {
    initializeAutoTrimps();
    setTimeout(delayStartAgain, startupDelay);
}
function delayStartAgain(){
    setInterval(mainLoop, runInterval);
    updateCustomButtons();
    document.getElementById('Prestige').value = autoTrimpSettings.PrestigeBackup.selected;
}

////////////////////////////////////////
//Main LOGIC Loop///////////////////////
////////////////////////////////////////

var OVKcellsWorld = 0;
function mainLoop() {
    stopScientistsatFarmers = 250000;   //put this here so it reverts every cycle (in case we portal out of watch challenge)
    game.global.addonUser = true;
    game.global.autotrimps = {
        firstgiga: getPageSetting('FirstGigastation'),
        deltagiga: getPageSetting('DeltaGigastation')
    }    
    if(getPageSetting('PauseScript') || game.options.menu.pauseGame.enabled) return;
    if(game.global.viewingUpgrades) return;
    //auto-close breaking the world textbox
    if(document.getElementById('tipTitle').innerHTML == 'The Improbability') cancelTooltip();
    //auto-close the corruption at zone 181 textbox
    if(document.getElementById('tipTitle').innerHTML == 'Corruption') cancelTooltip();
    //auto-close the Spire notification checkbox
    if(document.getElementById('tipTitle').innerHTML == 'Spire') cancelTooltip();
    setTitle();          //set the browser title
    setScienceNeeded();  //determine how much science is needed
    updateValueFields(); //refresh the UI
    updateValueFields2(); //refresh the UI2
    updateValueFields3(); //refresh the UI2

    if (getPageSetting('ExitSpireCell')) exitSpireCell(); //"Exit Spire After Cell" (genBTC settings area)
    if (getPageSetting('WorkerRatios')) workerRatios(); //"Auto Worker Ratios"
    if (getPageSetting('BuyUpgrades')) buyUpgrades();   //"Buy Upgrades"
    autoGoldenUpgrades();                               //"AutoGoldenUpgrades" (genBTC settings area)
    if (getPageSetting('BuyStorage')) buyStorage();     //"Buy Storage"
    if (getPageSetting('BuyBuildings')) buyBuildings(); //"Buy Buildings"
    if (getPageSetting('BuyJobs')) buyJobs();           //"Buy Jobs"    
    if (getPageSetting('ManualGather')) manualLabor();  //"Auto Gather/Build"
    if (getPageSetting('AutoMaps')) autoMap();          //"Auto Maps"    
    if (autoTrimpSettings.AutoPortal.selected != "Off") autoPortal();   //"Auto Portal" (hidden until level 60)
    if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap(); //"Trap Trimps"
    if (getPageSetting('AutoRoboTrimp')) autoRoboTrimp();   //"AutoRoboTrimp" (genBTC settings area)
    autoLevelEquipment();                                   //"Buy Armor", "Buy Armor Upgrades", "Buy Weapons","Buy Weapons Upgrades"
    if (getPageSetting('UseScryerStance')) 
        useScryerStance();                                  //"Use Scryer Stance"
    else
    	autoStance();                                           //"Auto Stance"
    getNiceThingsDone();					//Paint things.
    if (getPageSetting('AutoFight')) fightManual();//betterAutoFight();     //"Better Auto Fight"
    if (getPageSetting('DynamicPrestige')) prestigeChanging2(); //"Dynamic Prestige" (genBTC settings area)
    else autoTrimpSettings.Prestige.selected = document.getElementById('Prestige').value; //if we dont want to, just make sure the UI setting and the internal setting are aligned.
    
    //track how many overkill world cells we have beaten in the current level. (game.stats.cellsOverkilled.value for the entire run)
    if (game.portal.Overkill.level && (document.getElementById("grid").getElementsByClassName("cellColorOverkill").length > 0)) OVKcellsWorld = document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
    
    //Runs any user provided scripts - by copying and pasting a function named userscripts() into the Chrome Dev console. (F12)
    userscripts();
}

//left blank intentionally. the user will provide this. blank global vars are included as an example
var globalvar0,globalvar1,globalvar2,globalvar3,globalvar4,globalvar5,globalvar6,globalvar7,globalvar8,globalvar9;
function userscripts()
{
    //insert code here:
}

////////////////////////////////////////
//HTML/CSS/DOM Overwrites //////////////
////////////////////////////////////////

//we copied message function because this was not able to be called from function debug() without getting a weird scope? related "cannot find function" error.
var lastmessagecount = 1;
function message2(messageString, type, lootIcon, extraClass) {
    var log = document.getElementById("log");
    var needsScroll = ((log.scrollTop + 10) > (log.scrollHeight - log.clientHeight));
    var displayType = (AutoTrimpsDebugTabVisible) ? "block" : "none";
    var prefix = "";
    if (lootIcon && lootIcon.charAt(0) == "*") {
        lootIcon = lootIcon.replace("*", "");
        prefix =  "icomoon icon-";
    }
    else prefix = "glyphicon glyphicon-";
    //add timestamp
    if (game.options.menu.timestamps.enabled){ 
        messageString = ((game.options.menu.timestamps.enabled == 1) ? getCurrentTime() : updatePortalTimer(true)) + " " + messageString; 
    }
    //add a suitable icon for "AutoTrimps"
    if (lootIcon) 
        messageString = "<span class=\"" + prefix + lootIcon + "\"></span> " + messageString;
    messageString = "<span class=\"glyphicon glyphicon-superscript\"></span> " + messageString;
    messageString = "<span class=\"icomoon icon-text-color\"></span>" + messageString;

    var add = "<span class='" + type + "Message message" +  " " + extraClass + "' style='display: " + displayType + "'>" + messageString + "</span>";
    var toChange = document.getElementsByClassName(type + "Message");    
    if (toChange.length > 1 && toChange[toChange.length-1].innerHTML.indexOf(messageString) > -1){
        var msgToChange = toChange[toChange.length-1].innerHTML;
        lastmessagecount++;
        //search string backwards for the occurrence of " x" (meaning x21 etc)
        var foundXat = msgToChange.lastIndexOf(" x");
        if (foundXat != -1){
            toChange[toChange.length-1].innerHTML = msgToChange.slice(0,foundXat);  //and slice it out.
        }
        //so we can add a new number in.
        toChange[toChange.length-1].innerHTML += " x" + lastmessagecount;
    }
    else {
        lastmessagecount =1;
        log.innerHTML += add;
    }
    if (needsScroll) log.scrollTop = log.scrollHeight;
    trimMessages(type);
}

//HTML For adding a 5th tab to the message window
//
var ATbutton = document.createElement("button");
ATbutton.innerHTML = 'AutoTrimps';
ATbutton.setAttribute('id', 'AutoTrimpsFilter');
ATbutton.setAttribute('type', 'button');
ATbutton.setAttribute('onclick', "filterMessage2('AutoTrimps')");
ATbutton.setAttribute('class', "btn btn-success logFlt");
//
var tab = document.createElement("DIV");
tab.setAttribute('class', 'btn-group');
tab.setAttribute('role', 'group');
tab.appendChild(ATbutton);
document.getElementById('logBtnGroup').appendChild(tab);
//Toggle settings button & filter messages accordingly.
function filterMessage2(what){
    var log = document.getElementById("log");

    displayed = (AutoTrimpsDebugTabVisible) ? false : true;
    AutoTrimpsDebugTabVisible = displayed;

    var toChange = document.getElementsByClassName(what + "Message");
    var btnText = (displayed) ? what : what + " off";
    var btnElem = document.getElementById(what + "Filter");
    btnElem.innerHTML = btnText;
    btnElem.className = "";
    btnElem.className = getTabClass(displayed);
    displayed = (displayed) ? "block" : "none";
    for (var x = 0; x < toChange.length; x++){
        toChange[x].style.display = displayed;
    }
    log.scrollTop = log.scrollHeight;
}

var hrlmProtBtn1 = document.createElement("DIV");
hrlmProtBtn1.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn1.setAttribute('onclick', 'protectHeirloom(this,true)');
hrlmProtBtn1.innerHTML = 'Protect/Unprotect';  //since we cannot detect the selected heirloom on load, ambiguous name
hrlmProtBtn1.id='protectHeirloomBTN1';
var hrlmProtBtn2 = document.createElement("DIV");
hrlmProtBtn2.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn2.setAttribute('onclick', 'protectHeirloom(this,true)');
hrlmProtBtn2.innerHTML = 'Protect/Unprotect';
hrlmProtBtn2.id='protectHeirloomBTN2';
var hrlmProtBtn3 = document.createElement("DIV");
hrlmProtBtn3.setAttribute('class', 'noselect heirloomBtnActive heirBtn');
hrlmProtBtn3.setAttribute('onclick', 'protectHeirloom(this,true)');
hrlmProtBtn3.innerHTML = 'Protect/Unprotect';
hrlmProtBtn3.id='protectHeirloomBTN3';
document.getElementById('equippedHeirloomsBtnGroup').appendChild(hrlmProtBtn1);
document.getElementById('carriedHeirloomsBtnGroup').appendChild(hrlmProtBtn2);
document.getElementById('extraHeirloomsBtnGroup').appendChild(hrlmProtBtn3);


function protectHeirloom(element,modify){
    var selheirloom = game.global.selectedHeirloom;  //[number,location]
    var heirloomlocation = selheirloom[1];
    var heirloom = game.global[heirloomlocation];
    if (selheirloom[0] != -1)
        var heirloom = heirloom[selheirloom[0]];
    //hard way ^^, easy way>>
    //var heirloom = getSelectedHeirloom();
    if (modify)    //sent by onclick of protect button, to toggle the state.
        heirloom.protected = !heirloom.protected;
        
    if (!element) { //then we came from newSelectHeirloom
        if (heirloomlocation.includes("Equipped"))
            element = document.getElementById('protectHeirloomBTN1');
        else if (heirloomlocation == "heirloomsCarried")
            element = document.getElementById('protectHeirloomBTN2');
        else if (heirloomlocation == "heirloomsExtra")
            element = document.getElementById('protectHeirloomBTN3');
    }
    if (element)
        element.innerHTML = heirloom.protected ? 'UnProtect' : 'Protect';
}

//wrapper for selectHeirloom, to handle the protect button
function newSelectHeirloom(number, location, elem){
    selectHeirloom(number, location, elem);
    protectHeirloom();
}

//replacement function that inserts a new onclick action into the heirloom icons so it can populate the proper Protect icon. (yes this is the best way to do it.)
function generateHeirloomIcon(heirloom, location, number){
    if (typeof heirloom.name === 'undefined') return "<span class='icomoon icon-sad3'></span>";
    var icon = (heirloom.type == "Shield") ? 'icomoon icon-shield3' : 'glyphicon glyphicon-grain';
    var html = '<span class="heirloomThing heirloomRare' + heirloom.rarity;
    if (location == "Equipped") html += ' equipped';
    var locText = "";
    if (location == "Equipped") locText += '-1,\'' + heirloom.type + 'Equipped\'';
    else locText += number + ', \'heirlooms' + location + '\''; 
    html += '" onmouseover="tooltip(\'Heirloom\', null, event, null, ' + locText + ')" onmouseout="tooltip(\'hide\')" onclick="newSelectHeirloom(';
    html += locText + ', this)"> <span class="' + icon + '"></span></span>';
    return html;
}

    var fightButtonCol = document.getElementById("battleBtnsColumn");
    //create hider status
    newContainer = document.createElement("DIV");
    newContainer.setAttribute("style", "display: block; font-size: 1.1vw; text-align: center; background-color: rgba(0,0,0,0.3);");
    abutton = document.createElement("SPAN");
    abutton.id = 'hiderStatus';
    newContainer.appendChild(abutton);
    fightButtonCol.appendChild(newContainer);
    newContainer.setAttribute("onmouseover", 'tooltip(\"OverKill Chance\", \"customText\", event, \"Use Scryer Formation in zones if over 450%.<br>Get Dark Essence if over 100%.<br>Get less Prestige if over 15%.<br>buy more Warpstations if over 15%.<br>Save high level Void Maps if over 15%.<br>Farm Void Maps if under 15% and over 5%.<br>Get 20%-200% Map Bonus if 2.5%-6.5%.<br>Ignore high level Void Maps limits if over 5%.<br>Use Dominance Formation in maps if under 1%.<br>Allow He/Hr Auto Portal with Void Maps if under 1%.<br>He/Hr Auto Portal right after Void Maps Settings if under 1%.\")'); //Get +20% Map Bonus if in map and Breeding and if under 1%.<br>
    newContainer.setAttribute("onmouseout", 'tooltip("hide")');
    
    var fightButtonCol = document.getElementById("battleBtnsColumn");
    //create Area 51
    newContainer2 = document.createElement("DIV");
    newContainer2.setAttribute("style", "display: block; font-size: 1.1vw; text-align: center; background-color: rgba(0,0,0,0.3);");
    bbutton = document.createElement("SPAN");
    bbutton.id = 'Area52';
    newContainer2.appendChild(bbutton);
    fightButtonCol.appendChild(newContainer2);
    //newContainer2.setAttribute("onmouseover", 'tooltip(\"Data Window\", \"customText\", event, \"S-DMG (Scryer Demage) is<br> avgDamageXSstanceXOverkill.levelX0.005.<br>Max-HP is<br> EnemyMaxHealthXCorruptX7.\")');
    //newContainer2.setAttribute("onmouseout", 'tooltip("hide")');
var hiderwindow = 0;
var hiderWindow = document.getElementById('hiderWindow');
function updateValueFields2() {
    var hiderWindow = document.getElementById('hiderWindow');
    var hiderStatus = document.getElementById('hiderStatus');
    hiderStatus.innerHTML = (hiderwindow).toFixed(5); 
}

var Area51i = 0;
var Area51 = document.getElementById('Area51');
var Area60i = 0;
var Area60 = document.getElementById('Area60');
var armorValue = 0;
var armorTempValue = 0;
function updateValueFields3() {
    var Area51 = document.getElementById('Area51');
    var Area52 = document.getElementById('Area52');
    var Area60 = document.getElementById('Area60');
	var hePercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned))*100;
    Area52.innerHTML = 'He/hr: ' + getStats()+'<br>He: ' + (hePercent*(Date.now() - game.global.portalTime) / 3600000).toFixed(3) +'%'; //'S-DMG: ' + (Area51i).toPrecision(2) + '<br>Max-HP: ' + (Area60i).toPrecision(2) + '<br>He/hr: ' + getStats(); 
}
