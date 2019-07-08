require("dotenv").config();
import common from './modules/common.js';
import database from './modules/database.js';

global.common = common;
global.database = database;
