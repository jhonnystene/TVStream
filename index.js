/*
 * TVStream Server v1.0.1
 * Copyright (c) 2021 Johnny Stene <jhonnystene@protonmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// TODO: Autoconvert
// In the meantime use this command:
// for f in *.mkv; do ffmpeg -i "$f" -c copy "${f%.mkv}.mp4"; done
// Actually don't, FF breaks MP4 audio apparently

const PORT = 8080;
const SHOWDIR = "/home/johnny/movies-mnt/TV"; // Update this

const fs = require("fs");

const express = require("express");
const app = express();

console.log("Reading database.json...");
const jsonfile = require("jsonfile");
var database = jsonfile.readFileSync("database.json");

function saveDatabase() {
	console.log(`Saving database...`);
	jsonfile.writeFile("database.json", database, (err) => {
		if(err) console.log(`Failed to save database: ${err}`);
		else console.log("Successfully saved database.");
	});
}

function recursiveRefreshDatabase(path, category) {
	var realCategory = category;
	console.log(`Loading ${path} into database...`);
	var files = fs.readdirSync(path);

	if(files.indexOf("meta.json")) {
		var meta = jsonfile.readFileSync(path + "/meta.json");
		realCategory = meta["category"];
		console.log(`Found new category for directory: ${realCategory}`)
	}

	for(var i = 0; i < files.length; i++) {
		var file = files[i];
		var realFilePath = path + "/" + file;
		if(fs.lstatSync(realFilePath).isDirectory()) {
			recursiveRefreshDatabase(realFilePath, realCategory);
		} else {
			if(file.endsWith("webm") || file.endsWith("mp4")) {
				var fileObject = {}
				fileObject["path"] = realFilePath;
				fileObject["category"] = realCategory;
				database[Object.keys(database).length] = fileObject;
			}
		}
	}
}

function refreshDatabase() {
	console.log(`Rebuilding database (from ${SHOWDIR})...`);
	database = {};
	recursiveRefreshDatabase(SHOWDIR, "Misc.");
	console.log("Rebuilt database.");
	console.log(JSON.stringify(database));
	saveDatabase();
}

// Shamelessly stolen from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(a) {
	var j, x, i;
	for(i = a.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = a[i];
		a[i] = a[j];
		a[j] = x;
	}
	return a;
}

function getChannel(category) {
	var channel = [];
	for(const id in database) {
		if(database[id]["category"] == category) {
			channel.push(id);
		}
	}
	shuffle(channel);
	console.log(`Created channel "${category}" (${channel.length} items)`);
	return channel
}

function getCategoryList() {
	var channels = [];
	for(const id in database) {
		if(channels.indexOf(database[id]["category"]) == -1) {
			channels.push(database[id]["category"]);
		}
	}
	return channels;
}

app.use(express.static("public"));

app.get("/categories", (req, res) => {
	res.send(JSON.stringify(getCategoryList()));
});

// TODO: Save channels, only regen once channel is done
app.get("/channel/:category", (req, res) => {
	console.log(`Channel requested (category ${req.params.category})`);
	res.send(JSON.stringify(getChannel(req.params.category)));
});

app.get("/stream/:id", (req, res) => {
	console.log(`Stream requested (id ${req.params.id})`);
	res.sendFile(database[req.params.id]["path"]);
});

refreshDatabase();
app.listen(PORT);