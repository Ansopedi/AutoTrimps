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
var breedFire = false;
var shouldFarm = false;
var enoughDamage = true;
var enoughHealth = true;

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

var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency'];
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

function setTitle() {
    document.title = '(' + game.global.world + ')' + ' Trimps ' + document.getElementById('versionNumber').innerHTML;
    //for the dummies like me who always forget to turn automaps back on after portaling
    if(getPageSetting('RunUniqueMaps') && !game.upgrades.Battle.done && autoTrimpSettings.AutoMaps.enabled == false) {
        settingChanged("AutoMaps");
    }
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
    document.head.appendChild(document.createElement('script')).src = base + '/Graphs.js';
    document.head.appendChild(document.createElement('script')).src = base + '/AutoAutoPerks.js';
    document.head.appendChild(document.createElement('script')).src = base + '/HiderTrimp.js';
    toggleSettingsMenu();
    toggleSettingsMenu();
}

function workerRatios() {
        autoTrimpSettings.FarmerRatio.value = '1';
        autoTrimpSettings.LumberjackRatio.value = '50';
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
    if (bestBuilding == "Warpstation") {
        game.global.buyAmt = 4;
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
                if (hiderwindow < 100.0 && bestBuilding == "Warpstation") {
                    //Warpstation Wall - allow only warps that cost 1/n'th less then current metal (try to save metal for next prestige) 
                    var costratio = 100;  //(1/4th)                    
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

function buyBuildings() {
    if(game.global.world!=1 && ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist")))
        return;
    highlightHousing();
    if (bestBuilding!==null)
        safeBuyBuilding(bestBuilding);

    if (!game.buildings.Tribute.locked && (getPageSetting('MaxTribute') > game.buildings.Tribute.owned || getPageSetting('MaxTribute') == -1)) {
        safeBuyBuilding('Tribute');
    }
        if ((getPageSetting('MaxNursery') > game.buildings.Nursery.owned || getPageSetting('MaxNursery') == -1) && 
            (getBuildingItemPrice(game.buildings.Nursery, "wood", false, 1) < game.resources.wood.owned/50))
        {
            safeBuyBuilding('Nursery');
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
            Wall = (NextEff / NextCost > Res)&&game.global.world>200;
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

                if (game.resources[equip.Resource].owned > NeedResource&&(!(equip.Stat == 'health' && equip.Resource == 'metal' && game.global.world>200))) {
                    Status = 'red';
                } else {
                    Status = 'orange';
                }
            }
        }
    }
	
    if (equip.Stat == 'health' && equip.Resource == 'metal' && game.global.world>200){
	Res = 0;
        Wall = false;    
    }
    if (equip.Equip && game.equipment[equipName].level>=5 && game.global.world>200) {		
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
        if (upgrade == 'Coordination' && !canAffordCoordinationTrimps()) continue;
        if (upgrade == 'Shieldblock') continue;
        if ((!game.upgrades.Scientists.done && upgrade != 'Battle') ? (available && upgrade == 'Scientists' && game.upgrades.Scientists.allowed) : (available)) {
            buyUpgrade(upgrade, true, true);
            debug('Upgraded ' + upgrade,"*upload2");
        }
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
        if (owned > max * 0.8 || (owned + jest > max * 0.9)) {
            // debug('Buying ' + B + '(' + Bs[B] + ') at ' + Math.floor(game.resources[Bs[B]].owned / (game.resources[Bs[B]].max * packMod * 0.99) * 100) + '%');
            if (canAffordBuilding(B) && game.triggers[B].done) {
                safeBuyBuilding(B);
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
    if (game.resources.trimps.owned < game.resources.trimps.realMax() * 0.9 && !breedFire) return;  
    freeWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    if (getPageSetting('HireScientists') && !game.jobs.Scientist.locked) {
         //if earlier in the game, buy a small amount of scientists
         if (game.jobs.Farmer.owned < 1000000 && !breedFire) {
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
    var enemyDamage = 0;
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
    var enoughHealthE = true&&game.global.world>200;
    var enoughDamageE = hiderwindow>30&&game.global.world>200;

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
                    || gameResource.prestige < 5 || game.global.world <= 200 ) && (equipmentList[equipName].Stat == 'health'))
                        && 
                //Only buy Armor prestiges when 'DelayArmorWhenNeeded' is on, IF:
                        (
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
                if ((game.equipment[eqName].level<5 || game.global.world<=200) && DaThing.Equip && !Best[stat].Wall && canAffordBuilding(eqName, null, null, true)) {
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
	baseDamage *= (game.global.world%2===0&&game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.evenTrimpBuff!== 'undefined')?dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength):1;
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
        armorValue = ((baseHealth/8)/1*mutations.Corruption.statScale(3));
        armorTempValue = (game.global.soldierHealth/(1*mutations.Corruption.statScale(3)));
        if (hiderwindow > 120) { // && game.global.world < getPageSetting('VoidMaps')
             //enoughDamage = true; enoughHealth = true; shouldFarm = false;
        }
    }
	if (game.global.world>=71){
    var badMapHealth = ((game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badMapHealth !== 'undefined')?dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength):1);
    if (game.global.mapsActive && (getCurrentEnemy(1).name == "Jestimp" || getCurrentEnemy(1).name == "Chronoimp" ||  (hiderwindow > (800*0.45*0.12/mutations.Corruption.statScale(10)/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location != "Void"))){ setFormation(4); return;}
    if (game.global.mapsActive && (getCurrentEnemy(1).name != "Jestimp" && getCurrentEnemy(1).name != "Chronoimp" &&  (hiderwindow < (800*0.45*0.12/mutations.Corruption.statScale(10)/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location != "Void"))){ setFormation(2); return;}
    if (game.global.mapsActive && (getCurrentEnemy(1).name == "Jestimp" || getCurrentEnemy(1).name == "Chronoimp" ||  (hiderwindow > (800/(game.global.titimpLeft>0?2:1)*badMapHealth) && getCurrentMapObject().location == "Void"))){ setFormation(4); return;}
    if (!game.global.mapsActive && (hiderwindow > 660)){ setFormation(4); return;}
    
    
    if (game.global.gridArray.length === 0){ return;}
    setFormation(2);}
    
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
    if(game.options.menu.alwaysAbandon.enabled == 1) toggleSetting('alwaysAbandon');
    if(game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot'); 
    if(game.options.menu.repeatUntil.enabled == 2) toggleSetting('repeatUntil');
    if(game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if(game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    if (!game.global.mapsUnlocked) {        
        enoughDamage = true; enoughHealth = true; shouldFarm = false;
        return;
    }
    var noPrestigeBacklog = (((game.global.world-1)/5)<=game.upgrades.Dagadder.allowed+2&&game.upgrades.Dagadder.done<game.upgrades.Dagadder.allowed)||game.upgrades.Dagadder.done+2<game.upgrades.Dagadder.allowed;
    var oddNerf = (game.global.world%2===1&&game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.oddTrimpNerf!== 'undefined');
    var evenBuff = (game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.evenTrimpBuff!== 'undefined');
    var badMapHealth = ((game.global.challengeActive == "Daily"&&typeof game.global.dailyChallenge.badMapHealth !== 'undefined')?dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength):1);
    needToVoid = game.global.totalVoidMaps > 0 && (hiderwindow < 15*badMapHealth && hiderwindow > 5*badMapHealth && noPrestigeBacklog &&!oddNerf &&(!evenBuff||game.global.world%2===0)); 
    var selectedMap = "world";
    var mapYouSlow = false;
        if (
        ((game.global.mapBonus < 10 && hiderwindow < 0.0275 ) || (game.global.mapBonus < 9 && hiderwindow < 0.03 ) || (game.global.mapBonus < 8 && hiderwindow < 0.036 ) || (game.global.mapBonus < 7 && hiderwindow < 0.05 ) || (game.global.mapBonus < 6 && hiderwindow < 0.08 ) || (game.global.mapBonus < 5 && hiderwindow < 0.13 ) || (game.global.mapBonus < 4 && hiderwindow <0.2 ) || (game.global.mapBonus < 3 && hiderwindow < 0.5 ) || (game.global.mapBonus < 2 && hiderwindow < 0.75 ) || (game.global.mapBonus < 1 && hiderwindow < 100 && game.global.lastClearedCell<31 ) || (game.global.mapBonus < 1 && hiderwindow < 10 && game.global.lastClearedCell<51 )))	
	 {		
        shouldDoMaps = true;		
        mapYouSlow = true;		
        }		
    if (getPageSetting('GetNurseriesEarly') && game.global.world == 25 && game.global.mapBonus == 0) {
        shouldDoMaps = true;		
        mapYouSlow = true;
     }
    var voidArray = [];
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
    var voidArraySorted = voidArray.sort(function(a, b) {
        return a.sortByDiff - b.sortByDiff;
    });
    for (var map in voidArraySorted) {
        var theMap = voidArraySorted[map];
        //Only proceed if we needToVoid right now.
        if(needToVoid) {
            selectedMap = theMap.id;
            break;
        }
    }
    if (mapYouSlow || needToVoid) {
        if (selectedMap == "world") {
            if (mapYouSlow )
                if (game.global.world-1 <= game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].level&&26>=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].size&&1.80<=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].loot)
                    selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id;
                else
                    selectedMap = "create";
        }         
    }
    if (!game.global.preMapsActive && game.global.mapsActive) {
        if (!game.global.repeatMap) {
                repeatClicked();
             }
            if (
        (!((game.global.mapBonus+1 < 10 && hiderwindow < 0.0275 ) || (game.global.mapBonus+1 < 9 && hiderwindow < 0.03 ) || (game.global.mapBonus+1 < 8 && hiderwindow < 0.036 ) || (game.global.mapBonus+1 < 7 && hiderwindow < 0.05 ) || (game.global.mapBonus+1 < 6 && hiderwindow < 0.08 ) || (game.global.mapBonus+1 < 5 && hiderwindow < 0.13 ) || (game.global.mapBonus+1 < 4 && hiderwindow < 0.2 ) || (game.global.mapBonus+1 < 3 && hiderwindow < 0.5 ) || (game.global.mapBonus+1 < 2 && hiderwindow < 0.75 )))){
        	repeatClicked();
        }
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            if (!game.global.switchToMaps){
                mapsClicked();
            }
            if(
                game.global.switchToMaps 
                && 
                (needToVoid || mapYouSlow) 
                && (game.global.lastBreedTime >= 30000||game.global.lastBreedTime >=game.global.GeneticistassistSetting*1000||getBreedTime(true)==0)){
                mapsClicked();
            }
        }
    } if (game.global.preMapsActive) {
        if (selectedMap == "world") {
            mapsClicked();
        } 
        else if (selectedMap == "create") { 
            if (false)
                document.getElementById("mapLevelInput").value = game.global.world;
            else if (mapYouSlow){
            	document.getElementById("mapLevelInput").value = game.global.world-1;
            }
            else
                document.getElementById("mapLevelInput").value = siphlvl;
            
                sizeAdvMapsRange.value = 9;
                adjustMap('size', 9);
                difficultyAdvMapsRange.value = 9;
                adjustMap('difficulty', 9);
                lootAdvMapsRange.value = 9;
                adjustMap('loot', 9);

                biomeAdvMapsSelect.value = "Plentiful";
                updateMapCost();
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
                if (26>=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].size&&1.80<=game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].loot){
                    break;
                }
            }
            selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id;
            selectMap(selectedMap);
            runMap();
        } else {
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
//Version 3.6 Golden Upgrades
function autoGoldenUpgrades() {
    //get the numerical value of the selected index of the dropdown box
    var setting = document.getElementById('AutoGoldenUpgrades').value;
    if (setting == "Off") return;   //if disabled, exit.
    var num = getAvailableGoldenUpgrades();
    if (num == 0) return;       //if we have nothing to buy, exit.
	
    if (getPageSetting('GoldenBattleZone')<=game.global.world){
     	buyGoldenUpgrade("Battle");
     }
    else{
    buyGoldenUpgrade(setting);
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
    updateValueFields(); //refresh the UI
    updateValueFields2(); //refresh the UI2
    updateValueFields3(); //refresh the UI2

    if (getPageSetting('WorkerRatios')) workerRatios(); //"Auto Worker Ratios"
    autoGoldenUpgrades();                               //"AutoGoldenUpgrades" (genBTC settings area)
    if (getPageSetting('BuyStorage')) buyStorage();     //"Buy Storage"
    if (getPageSetting('BuyBuildings')) buyBuildings(); //"Buy Buildings"
    if (getPageSetting('BuyJobs')) buyJobs();           //"Buy Jobs"    
    if (getPageSetting('ManualGather')) manualLabor();  //"Auto Gather/Build"  
    if (autoTrimpSettings.AutoPortal.selected != "Off") autoPortal();   //"Auto Portal" (hidden until level 60)
    if (getPageSetting('TrapTrimps') && game.global.trapBuildAllowed && game.global.trapBuildToggled == false) toggleAutoTrap(); //"Trap Trimps"
    autoLevelEquipment();                                   //"Buy Armor", "Buy Armor Upgrades", "Buy Weapons","Buy Weapons Upgrades"
    if (getPageSetting('BuyUpgrades')) buyUpgrades();   //"Buy Upgrades"
    autoStance();                                           //"Auto Stance"
    if (getPageSetting('AutoMaps')) autoMap();          //"Auto Maps"  
    getNiceThingsDone();					//Paint things.
    if (getPageSetting('AutoFight')) fightManual();//betterAutoFight();     //"Better Auto Fight"
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
