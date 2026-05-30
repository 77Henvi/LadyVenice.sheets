// Entry point — imports trigger all module initialization
import './utils.js';   // openModal / closeModal → window
import './ui.js';      // switchTab → window
import './auth.js';    // onAuthStateChanged → calls main.init() on login