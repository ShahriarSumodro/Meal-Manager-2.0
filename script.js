(function(){

var SK = 'mealManager_accounts';
var accounts = {};
var currentId = null;
var currentTab = 'chart';
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

var app, modal;

function init() {
  app = document.getElementById('app');
  modal = document.getElementById('modal');
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  load();
  renderLanding();
}

function load() {
  try {
    var d = localStorage.getItem(SK);
    if (d) {
      accounts = JSON.parse(d);
    }
    if (typeof accounts !== 'object' || accounts === null) {
      accounts = {};
    }
  } catch(e) {
    accounts = {};
    showRecovery();
  }
}

function save() {
  try {
    localStorage.setItem(SK, JSON.stringify(accounts));
  } catch(e) {}
}

function showRecovery() {
  modal.innerHTML = '<div class="modal-c"><h3>Data Recovery</h3><p>Storage may be corrupted. Data was reset.</p><div class="btns"><button id="recOkBtn">OK</button></div></div>';
  modal.classList.remove('hidden');
  setTimeout(function() {
    var btn = document.getElementById('recOkBtn');
    if (btn) btn.addEventListener('click', closeModal);
  }, 0);
}

function renderAccount() {
  var a = accounts[currentId];
  if (!a) {
    renderLanding();
    return;
  }
  
  app.innerHTML = '<div class="hdr"><button class="btn-s" id="backBtn">← Back</button><h2>' + a.managerName + ' - ' + months[a.month - 1] + ' ' + a.year + '</h2></div>' +
    '<div class="tabs">' +
      '<button class="tab-btn" data-tab="chart">Chart</button>' +
      '<button class="tab-btn" data-tab="profile">Profile</button>' +
      '<button class="tab-btn" data-tab="expense">Expense</button>' +
      '<button class="tab-btn" data-tab="review">Review</button>' +
    '</div>' +
    '<div id="tabContent"></div>';
  
  setTimeout(function() {
    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', renderLanding);
    
    var tabBtns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].addEventListener('click', function() {
        currentTab = this.getAttribute('data-tab');
        updateTabUI();
        renderTabContent();
      });
    }
    
    updateTabUI();
    renderTabContent();
  }, 0);
}

function updateTabUI() {
  var tabBtns = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabBtns.length; i++) {
    var btn = tabBtns[i];
    if (btn.getAttribute('data-tab') === currentTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

function renderTabContent() {
  var tc = document.getElementById('tabContent');
  if (!tc) return;
  
  if (currentTab === 'chart') {
    renderChart(tc);
  } else if (currentTab === 'profile') {
    renderProfile(tc);
  } else if (currentTab === 'expense') {
    renderExpense(tc);
  } else if (currentTab === 'review') {
    renderReview(tc);
  }
}

function renderChart(tc) {
  var a = accounts[currentId];
  if (!a) return;
  
  var days = daysInMonth(a.month, a.year);
  
  var hdr = '<th>Name</th>';
  for (var d = 1; d <= days; d++) {
    hdr += '<th>' + months[a.month - 1].substr(0, 3) + ' ' + d + '</th>';
  }
  
  var rows = '';
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var r = '<td>' + n.name + '</td>';
    for (var dd = 1; dd <= days; dd++) {
      var m = a.meals[dd] && a.meals[dd][n.id];
      var v = m ? m.total : 0;
      r += '<td class="cell' + (v ? ' has-v' : '') + '" data-nid="' + n.id + '" data-day="' + dd + '">' + (v || '') + '</td>';
    }
    rows += '<tr>' + r + '</tr>';
  }
  
  tc.innerHTML = '<div class="tab-c">' +
    '<div class="add-n"><input id="nameIn" placeholder="Add name"><button id="addNameBtn">Add</button></div>' +
    '<div class="chart-w"><table class="chart"><thead><tr>' + hdr + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
  '</div>';
  
  setTimeout(function() {
    var addBtn = document.getElementById('addNameBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var nameIn = document.getElementById('nameIn');
        var nm = nameIn ? nameIn.value.trim() : '';
        if (!nm) {
          alert('Name required');
          return;
        }
        for (var j = 0; j < a.names.length; j++) {
          if (a.names[j].name.toLowerCase() === nm.toLowerCase()) {
            alert('Name exists');
            return;
          }
        }
        var id = uid();
        a.names.push({ id: id, name: nm });
        a.deposits[id] = [];
        a.extras[id] = [];
        save();
        renderTabContent();
      });
    }
    
    var cells = document.querySelectorAll('.cell');
    for (var c = 0; c < cells.length; c++) {
      cells[c].addEventListener('click', function() {
        var nid = this.getAttribute('data-nid');
        var day = parseInt(this.getAttribute('data-day'));
        showMealModal(nid, day);
      });
    }
  }, 0);
}

function showMealModal(nid, day) {
  var a = accounts[currentId];
  if (!a) return;
  
  var m = a.meals[day] && a.meals[day][nid];
  var nm = null;
  for (var i = 0; i < a.names.length; i++) {
    if (a.names[i].id === nid) {
      nm = a.names[i];
      break;
    }
  }
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>' + (nm ? nm.name : '') + ' - ' + months[a.month - 1] + ' ' + day + '</h3>' +
    '<div class="field"><label>Day Meals</label><input id="dayIn" type="number" step="0.25" min="0" value="' + (m ? m.day : 0) + '"></div>' +
    '<div class="field"><label>Night Meals</label><input id="nightIn" type="number" step="0.25" min="0" value="' + (m ? m.night : 0) + '"></div>' +
    '<div class="btns"><button class="btn-s" id="mealCancelBtn">Cancel</button><button id="saveMealBtn">Save</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('mealCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var saveBtn = document.getElementById('saveMealBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var dayIn = document.getElementById('dayIn');
        var nightIn = document.getElementById('nightIn');
        var dv = dayIn ? (parseFloat(dayIn.value) || 0) : 0;
        var nv = nightIn ? (parseFloat(nightIn.value) || 0) : 0;
        if (dv < 0) dv = 0;
        if (nv < 0) nv = 0;
        if (!a.meals[day]) a.meals[day] = {};
        a.meals[day][nid] = { day: dv, night: nv, total: dv + nv };
        save();
        closeModal();
        renderTabContent();
      });
    }
  }, 0);
}

function calcAll() {
  var a = accounts[currentId];
  if (!a) return { totalMeals: 0, totalCost: 0, rate: 0, persons: {} };
  
  var totalMeals = 0;
  var totalCost = 0;
  var persons = {};
  
  // Initialize persons data
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    persons[n.id] = { meals: 0, deposited: 0, extra: 0, cost: 0, txn: 0 };
  }
  
  // Calculate meals for each person
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var pm = 0;
    for (var d in a.meals) {
      if (a.meals.hasOwnProperty(d) && a.meals[d][n.id]) {
        pm += a.meals[d][n.id].total;
      }
    }
    persons[n.id].meals = pm;
    totalMeals += pm;
  }
  
  // Calculate deposits for each person
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var dep = 0;
    var depArr = a.deposits[n.id] || [];
    for (var j = 0; j < depArr.length; j++) {
      dep += depArr[j].amount;
    }
    persons[n.id].deposited = dep;
  }
  
  // Calculate extras for each person
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var ext = 0;
    var extArr = a.extras[n.id] || [];
    for (var k = 0; k < extArr.length; k++) {
      ext += extArr[k].amount;
    }
    persons[n.id].extra = ext;
  }
  
  // Calculate total cost from expenses
  for (var e = 0; e < a.expenses.length; e++) {
    totalCost += a.expenses[e].amount;
  }
  
  // Calculate meal rate
  var rate = totalMeals > 0 ? round2(totalCost / totalMeals) : 0;
  
  // Calculate person cost and transaction
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var p = persons[n.id];
    p.cost = round2(p.meals * rate) + p.extra;
    p.txn = round2(p.deposited - p.cost);
  }
  
  return { totalMeals: totalMeals, totalCost: totalCost, rate: rate, persons: persons };
}

function renderProfile(tc) {
  var a = accounts[currentId];
  if (!a) return;
  
  var calc = calcAll();
  
  if (!a.names.length) {
    tc.innerHTML = '<div class="tab-c"><div class="empty">No names added. Go to Chart tab to add names.</div></div>';
    return;
  }
  
  var h = '';
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var pc = calc.persons[n.id] || { meals: 0, deposited: 0, extra: 0, cost: 0, txn: 0 };
    var txnCls = pc.txn > 0 ? 'owed' : (pc.txn < 0 ? 'owes' : '');
    var deps = a.deposits[n.id] || [];
    var exts = a.extras[n.id] || [];
    
    var depH = '';
    for (var j = 0; j < deps.length; j++) {
      var d = deps[j];
      depH += '<div class="entry">' +
        '<span class="info">' + d.date + (d.description ? ' - ' + d.description : '') + '</span>' +
        '<span class="amt">' + d.amount + ' TK</span>' +
        '<button class="btn-s dep-edit" data-nid="' + n.id + '" data-idx="' + j + '">Edit</button>' +
        '<button class="btn-d dep-del" data-nid="' + n.id + '" data-idx="' + j + '">×</button>' +
      '</div>';
    }
    if (!depH) depH = '<div class="empty" style="padding:12px">No deposits</div>';
    
    var extH = '';
    for (var k = 0; k < exts.length; k++) {
      var ex = exts[k];
      extH += '<div class="entry">' +
        '<span class="info">' + ex.date + '</span>' +
        '<span class="amt">' + ex.amount + ' TK</span>' +
        '<button class="btn-s ext-edit" data-nid="' + n.id + '" data-idx="' + k + '">Edit</button>' +
        '<button class="btn-d ext-del" data-nid="' + n.id + '" data-idx="' + k + '">×</button>' +
      '</div>';
    }
    if (!extH) extH = '<div class="empty" style="padding:12px">No extras</div>';
    
    var txnText = 'Settled';
    if (pc.txn > 0) txnText = 'Manager owes: ' + round2(pc.txn) + ' TK';
    else if (pc.txn < 0) txnText = 'Owes manager: ' + round2(Math.abs(pc.txn)) + ' TK';
    
    h += '<div class="p-card">' +
      '<div class="p-name">' +
        '<span>' + n.name + '</span>' +
        '<button class="btn-s name-edit" data-nid="' + n.id + '">Edit</button>' +
        '<button class="btn-d name-del" data-nid="' + n.id + '">Delete</button>' +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat"><label>Total Meals</label><span>' + round2(pc.meals) + '</span></div>' +
        '<div class="stat"><label>Deposited</label><span>' + pc.deposited + ' TK</span></div>' +
        '<div class="stat"><label>Extra Cost</label><span>' + pc.extra + ' TK</span></div>' +
        '<div class="stat"><label>Meal Cost</label><span>' + round2(pc.cost) + ' TK</span></div>' +
      '</div>' +
      '<div class="txn ' + txnCls + '">' + txnText + '</div>' +
      '<div class="section">' +
        '<div class="section-hdr">Deposits <button class="dep-add" data-nid="' + n.id + '">+ Add</button></div>' +
        depH +
      '</div>' +
      '<div class="section">' +
        '<div class="section-hdr">Extras <button class="ext-add" data-nid="' + n.id + '">+ Add</button></div>' +
        extH +
      '</div>' +
    '</div>';
  }
  
  tc.innerHTML = '<div class="tab-c">' + h + '</div>';
  
  setTimeout(function() {
    bindProfileEvents(a);
  }, 0);
}

function bindProfileEvents(a) {
  var nameEditBtns = document.querySelectorAll('.name-edit');
  for (var x = 0; x < nameEditBtns.length; x++) {
    nameEditBtns[x].addEventListener('click', function() {
      showEditName(this.getAttribute('data-nid'));
    });
  }
  
  var nameDelBtns = document.querySelectorAll('.name-del');
  for (var x = 0; x < nameDelBtns.length; x++) {
    nameDelBtns[x].addEventListener('click', function() {
      var id = this.getAttribute('data-nid');
      if (confirm('Delete this person and all their data?')) {
        for (var z = 0; z < a.names.length; z++) {
          if (a.names[z].id === id) {
            a.names.splice(z, 1);
            break;
          }
        }
        delete a.deposits[id];
        delete a.extras[id];
        delete a.settlements[id];
        for (var dd in a.meals) {
          if (a.meals.hasOwnProperty(dd)) {
            delete a.meals[dd][id];
          }
        }
        save();
        renderTabContent();
      }
    });
  }
  
  var depAddBtns = document.querySelectorAll('.dep-add');
  for (var x = 0; x < depAddBtns.length; x++) {
    depAddBtns[x].addEventListener('click', function() {
      showDepositModal(this.getAttribute('data-nid'));
    });
  }
  
  var depEditBtns = document.querySelectorAll('.dep-edit');
  for (var x = 0; x < depEditBtns.length; x++) {
    depEditBtns[x].addEventListener('click', function() {
      var nid = this.getAttribute('data-nid');
      var idx = parseInt(this.getAttribute('data-idx'));
      showDepositModal(nid, idx);
    });
  }
  
  var depDelBtns = document.querySelectorAll('.dep-del');
  for (var x = 0; x < depDelBtns.length; x++) {
    depDelBtns[x].addEventListener('click', function() {
      var nid = this.getAttribute('data-nid');
      var idx = parseInt(this.getAttribute('data-idx'));
      a.deposits[nid].splice(idx, 1);
      save();
      renderTabContent();
    });
  }
  
  var extAddBtns = document.querySelectorAll('.ext-add');
  for (var x = 0; x < extAddBtns.length; x++) {
    extAddBtns[x].addEventListener('click', function() {
      showExtraModal(this.getAttribute('data-nid'));
    });
  }
  
  var extEditBtns = document.querySelectorAll('.ext-edit');
  for (var x = 0; x < extEditBtns.length; x++) {
    extEditBtns[x].addEventListener('click', function() {
      var nid = this.getAttribute('data-nid');
      var idx = parseInt(this.getAttribute('data-idx'));
      showExtraModal(nid, idx);
    });
  }
  
  var extDelBtns = document.querySelectorAll('.ext-del');
  for (var x = 0; x < extDelBtns.length; x++) {
    extDelBtns[x].addEventListener('click', function() {
      var nid = this.getAttribute('data-nid');
      var idx = parseInt(this.getAttribute('data-idx'));
      a.extras[nid].splice(idx, 1);
      save();
      renderTabContent();
    });
  }
}

function showEditName(nid) {
  var a = accounts[currentId];
  if (!a) return;
  
  var n = null;
  for (var i = 0; i < a.names.length; i++) {
    if (a.names[i].id === nid) {
      n = a.names[i];
      break;
    }
  }
  if (!n) return;
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>Edit Name</h3>' +
    '<div class="field"><label>Name</label><input id="nameEditIn" value="' + n.name + '"></div>' +
    '<div class="btns"><button class="btn-s" id="nameEditCancelBtn">Cancel</button><button id="saveNameBtn">Save</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('nameEditCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var saveBtn = document.getElementById('saveNameBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var nameIn = document.getElementById('nameEditIn');
        var nm = nameIn ? nameIn.value.trim() : '';
        if (!nm) {
          alert('Name required');
          return;
        }
        for (var j = 0; j < a.names.length; j++) {
          if (a.names[j].id !== nid && a.names[j].name.toLowerCase() === nm.toLowerCase()) {
            alert('Name exists');
            return;
          }
        }
        n.name = nm;
        save();
        closeModal();
        renderTabContent();
      });
    }
  }, 0);
}

function showDepositModal(nid, idx) {
  var a = accounts[currentId];
  if (!a) return;
  
  var isEdit = idx !== undefined;
  var dep = isEdit ? a.deposits[nid][idx] : null;
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>' + (isEdit ? 'Edit' : 'Add') + ' Deposit</h3>' +
    '<div class="field"><label>Date</label><input id="depDate" type="date" value="' + (dep ? dep.date : todayStr()) + '"></div>' +
    '<div class="field"><label>Amount (TK)</label><input id="depAmt" type="number" min="0" step="1" value="' + (dep ? dep.amount : '') + '"></div>' +
    '<div class="field"><label>Description (optional)</label><input id="depDesc" value="' + (dep && dep.description ? dep.description : '') + '"></div>' +
    '<div class="btns"><button class="btn-s" id="depCancelBtn">Cancel</button><button id="saveDepBtn">Save</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('depCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var saveBtn = document.getElementById('saveDepBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var dateIn = document.getElementById('depDate');
        var amtIn = document.getElementById('depAmt');
        var descIn = document.getElementById('depDesc');
        
        var date = dateIn ? dateIn.value : '';
        var amt = amtIn ? parseInt(amtIn.value) : NaN;
        var desc = descIn ? descIn.value.trim() : '';
        
        if (!date) {
          alert('Date required');
          return;
        }
        if (isNaN(amt) || amt < 0) {
          alert('Valid amount required');
          return;
        }
        
        var obj = { date: date, amount: amt };
        if (desc) obj.description = desc;
        
        if (!a.deposits[nid]) a.deposits[nid] = [];
        if (isEdit) {
          a.deposits[nid][idx] = obj;
        } else {
          a.deposits[nid].push(obj);
        }
        save();
        closeModal();
        renderTabContent();
      });
    }
  }, 0);
}

function showExtraModal(nid, idx) {
  var a = accounts[currentId];
  if (!a) return;
  
  var isEdit = idx !== undefined;
  var ext = isEdit ? a.extras[nid][idx] : null;
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>' + (isEdit ? 'Edit' : 'Add') + ' Extra</h3>' +
    '<div class="field"><label>Date</label><input id="extDate" type="date" value="' + (ext ? ext.date : todayStr()) + '"></div>' +
    '<div class="field"><label>Amount (TK)</label><input id="extAmt" type="number" min="0" step="1" value="' + (ext ? ext.amount : '') + '"></div>' +
    '<div class="btns"><button class="btn-s" id="extCancelBtn">Cancel</button><button id="saveExtBtn">Save</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('extCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var saveBtn = document.getElementById('saveExtBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var dateIn = document.getElementById('extDate');
        var amtIn = document.getElementById('extAmt');
        
        var date = dateIn ? dateIn.value : '';
        var amt = amtIn ? parseInt(amtIn.value) : NaN;
        
        if (!date) {
          alert('Date required');
          return;
        }
        if (isNaN(amt) || amt < 0) {
          alert('Valid amount required');
          return;
        }
        
        if (!a.extras[nid]) a.extras[nid] = [];
        if (isEdit) {
          a.extras[nid][idx] = { date: date, amount: amt };
        } else {
          a.extras[nid].push({ date: date, amount: amt });
        }
        save();
        closeModal();
        renderTabContent();
      });
    }
  }, 0);
}

function renderExpense(tc) {
  var a = accounts[currentId];
  if (!a) return;
  
  var total = 0;
  for (var i = 0; i < a.expenses.length; i++) {
    total += a.expenses[i].amount;
  }
  
  var sorted = a.expenses.slice().sort(function(x, y) {
    return x.date.localeCompare(y.date);
  });
  
  var h = '';
  for (var i = 0; i < sorted.length; i++) {
    var e = sorted[i];
    var oi = a.expenses.indexOf(e);
    h += '<div class="exp-card">' +
      '<div class="info">' +
        '<div class="cat">' + (e.category || 'Uncategorized') + '</div>' +
        '<div class="date">' + e.date + '</div>' +
      '</div>' +
      '<div class="amt">' + e.amount + ' TK</div>' +
      '<button class="btn-s exp-edit" data-idx="' + oi + '">Edit</button>' +
      '<button class="btn-d exp-del" data-idx="' + oi + '">×</button>' +
    '</div>';
  }
  if (!h) h = '<div class="empty">No expenses</div>';
  
  tc.innerHTML = '<div class="tab-c">' +
    '<div class="total-bar"><span>Total Expense</span><strong>' + total + ' TK</strong></div>' +
    '<button id="addExpBtn" style="width:100%;margin-bottom:16px">+ Add Expense</button>' +
    h +
  '</div>';
  
  setTimeout(function() {
    var addBtn = document.getElementById('addExpBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        showExpenseModal();
      });
    }
    
    var expEditBtns = document.querySelectorAll('.exp-edit');
    for (var x = 0; x < expEditBtns.length; x++) {
      expEditBtns[x].addEventListener('click', function() {
        showExpenseModal(parseInt(this.getAttribute('data-idx')));
      });
    }
    
    var expDelBtns = document.querySelectorAll('.exp-del');
    for (var x = 0; x < expDelBtns.length; x++) {
      expDelBtns[x].addEventListener('click', function() {
        a.expenses.splice(parseInt(this.getAttribute('data-idx')), 1);
        save();
        renderTabContent();
      });
    }
  }, 0);
}

function showExpenseModal(idx) {
  var a = accounts[currentId];
  if (!a) return;
  
  var isEdit = idx !== undefined;
  var exp = isEdit ? a.expenses[idx] : null;
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>' + (isEdit ? 'Edit' : 'Add') + ' Expense</h3>' +
    '<div class="field"><label>Date *</label><input id="expDate" type="date" value="' + (exp ? exp.date : todayStr()) + '"></div>' +
    '<div class="field"><label>Category (optional)</label><input id="expCat" placeholder="e.g. Rice, Fish" value="' + (exp && exp.category ? exp.category : '') + '"></div>' +
    '<div class="field"><label>Amount (TK) *</label><input id="expAmt" type="number" min="1" step="1" value="' + (exp ? exp.amount : '') + '"></div>' +
    '<div class="btns"><button class="btn-s" id="expCancelBtn">Cancel</button><button id="saveExpBtn">Save</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('expCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var saveBtn = document.getElementById('saveExpBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var dateIn = document.getElementById('expDate');
        var catIn = document.getElementById('expCat');
        var amtIn = document.getElementById('expAmt');
        
        var date = dateIn ? dateIn.value : '';
        var cat = catIn ? catIn.value.trim() : '';
        var amt = amtIn ? parseInt(amtIn.value) : NaN;
        
        if (!date) {
          alert('Date required');
          return;
        }
        if (isNaN(amt) || amt < 1) {
          alert('Valid positive amount required');
          return;
        }
        
        var obj = { date: date, amount: amt };
        if (cat) obj.category = cat;
        
        if (isEdit) {
          a.expenses[idx] = obj;
        } else {
          a.expenses.push(obj);
        }
        save();
        closeModal();
        renderTabContent();
      });
    }
  }, 0);
}

function renderReview(tc) {
  var a = accounts[currentId];
  if (!a) return;
  
  var c = calcAll();
  
  var rows = '';
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var p = c.persons[n.id];
    var done = a.settlements[n.id];
    var txnCls = p.txn > 0 ? 'txn-p' : (p.txn < 0 ? 'txn-n' : '');
    rows += '<tr class="' + (done ? 'done-row' : '') + '">' +
      '<td>' + n.name + '</td>' +
      '<td>' + round2(p.meals) + '</td>' +
      '<td>' + p.deposited + '</td>' +
      '<td>' + p.extra + '</td>' +
      '<td class="' + txnCls + '">' + round2(p.txn) + ' TK</td>' +
      '<td><input type="checkbox" class="settle-chk" data-nid="' + n.id + '"' + (done ? ' checked' : '') + '></td>' +
    '</tr>';
  }
  
  if (!rows) rows = '<tr><td colspan="6" style="text-align:center;color:var(--txt2)">No data</td></tr>';
  
  tc.innerHTML = '<div class="tab-c">' +
    '<div class="print-h"><h2>' + a.managerName + '</h2><p>' + months[a.month - 1] + ' ' + a.year + '</p></div>' +
    '<div class="rev-s">' +
      '<div class="row"><label>Total Meals</label><span>' + round2(c.totalMeals) + '</span></div>' +
      '<div class="row"><label>Total Expense</label><span>' + c.totalCost + ' TK</span></div>' +
      '<div class="row"><label>Meal Rate</label><span>' + c.rate + ' TK</span></div>' +
    '</div>' +
    '<div class="rev-t-wrap">' +
      '<table class="rev-t">' +
        '<thead><tr><th>Name</th><th>Meal</th><th>Deposited</th><th>Extra</th><th>Transaction</th><th>Done</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +
    '<div class="exp-btns">' +
      '<button id="printRevBtn">Print Review</button>' +
      '<button id="printChartBtn">Print Chart</button>' +
      '<button id="exportJsonBtn">Export JSON</button>' +
    '</div>' +
  '</div>';
  
  setTimeout(function() {
    var settleChks = document.querySelectorAll('.settle-chk');
    for (var x = 0; x < settleChks.length; x++) {
      settleChks[x].addEventListener('change', function() {
        var nid = this.getAttribute('data-nid');
        a.settlements[nid] = this.checked;
        save();
        renderTabContent();
      });
    }
    
    var printRevBtn = document.getElementById('printRevBtn');
    if (printRevBtn) {
      printRevBtn.addEventListener('click', function() {
        window.print();
      });
    }
    
    var printChartBtn = document.getElementById('printChartBtn');
    if (printChartBtn) {
      printChartBtn.addEventListener('click', printChart);
    }
    
    var exportBtn = document.getElementById('exportJsonBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportJson);
    }
  }, 0);
}

function printChart() {
  var a = accounts[currentId];
  if (!a) return;
  
  var days = daysInMonth(a.month, a.year);
  
  var hdr = '<th>Name</th>';
  for (var d = 1; d <= days; d++) {
    hdr += '<th>' + d + '</th>';
  }
  
  var rows = '';
  for (var i = 0; i < a.names.length; i++) {
    var n = a.names[i];
    var r = '<td>' + n.name + '</td>';
    for (var dd = 1; dd <= days; dd++) {
      var m = a.meals[dd] && a.meals[dd][n.id];
      r += '<td>' + (m ? m.total : '') + '</td>';
    }
    rows += '<tr>' + r + '</tr>';
  }
  
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><title>Meal Chart</title><style>body{font-family:sans-serif}h2{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:4px;text-align:center;font-size:10px}@page{size:landscape}</style></head><body><h2>' + a.managerName + ' - ' + months[a.month - 1] + ' ' + a.year + '</h2><table><thead><tr>' + hdr + '</tr></thead><tbody>' + rows + '</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>');
  w.document.close();
}

function exportJson() {
  var a = accounts[currentId];
  if (!a) return;
  
  var blob = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'meal_' + months[a.month - 1] + '_' + a.year + '.json';
  link.click();
  URL.revokeObjectURL(url);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();

function closeModal() {
  modal.classList.add('hidden');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function now() {
  var d = new Date();
  return { m: d.getMonth() + 1, y: d.getFullYear(), d: d.getDate() };
}

function daysInMonth(m, y) {
  return new Date(y, m, 0).getDate();
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function todayStr() {
  var d = new Date();
  var mm = String(d.getMonth() + 1);
  if (mm.length < 2) mm = '0' + mm;
  var dd = String(d.getDate());
  if (dd.length < 2) dd = '0' + dd;
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function getCurrent() {
  var n = now();
  for (var id in accounts) {
    if (accounts.hasOwnProperty(id)) {
      var a = accounts[id];
      if (a.month === n.m && a.year === n.y) return a;
    }
  }
  return null;
}

function getHistory() {
  var n = now();
  var list = [];
  for (var id in accounts) {
    if (accounts.hasOwnProperty(id)) {
      var a = accounts[id];
      if (a.year < n.y || (a.year === n.y && a.month < n.m)) {
        list.push(a);
      }
    }
  }
  list.sort(function(x, y) {
    return (y.year * 12 + y.month) - (x.year * 12 + x.month);
  });
  return list;
}

function getMostRecentPast() {
  var hist = getHistory();
  return hist.length ? hist[0] : null;
}

function renderLanding() {
  currentId = null;
  currentTab = 'chart';
  var cur = getCurrent();
  
  var html = '<div class="landing">' +
    '<button id="curBtn"' + (cur ? '' : ' disabled') + '>' + (cur ? 'Current Account' : 'No current month — Create') + '</button>' +
    '<button id="histBtn">History</button>' +
    '<button id="createBtn">Create</button>' +
    '<button class="help-t" id="helpBtn">Help</button>' +
    '<div id="helpC" class="help-c hidden">' +
      '<h4>Getting Started</h4>' +
      '<p>Create a new account for each month. One account can be "current" (matches device month/year).</p>' +
      '<h4>Meal Chart</h4>' +
      '<p>Tap any cell to enter day/night meals. Values can be 0, 0.25, 0.5, etc.</p>' +
      '<h4>Profile</h4>' +
      '<p>View each person\'s meals, deposits, extras. Add deposits and extras with dates.</p>' +
      '<h4>Expenses</h4>' +
      '<p>Track all mess expenses by category and date.</p>' +
      '<h4>Review</h4>' +
      '<p>See final calculations. Meal Rate = Total Expense / Total Meals. Person Cost = (Meals × Rate) + Extras. Transaction = Deposit - Cost.</p>' +
      '<h4>Export</h4>' +
      '<p>Print Review or Meal Chart as PDF. Export JSON for backup.</p>' +
      '<h4>Reset App</h4>' +
      '<p>Use this if data is corrupted. All data will be lost.</p>' +
      '<button class="btn-d" id="resetAppBtn" style="margin-top:12px">Reset App</button>' +
    '</div>' +
  '</div>';
  
  app.innerHTML = html;
  
  setTimeout(function() {
    var curBtn = document.getElementById('curBtn');
    if (cur && curBtn) {
      curBtn.addEventListener('click', function() {
        currentId = cur.id;
        renderAccount();
      });
    }
    
    var histBtn = document.getElementById('histBtn');
    if (histBtn) histBtn.addEventListener('click', renderHistory);
    
    var createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);
    
    var helpOpen = false;
    var helpBtn = document.getElementById('helpBtn');
    var helpC = document.getElementById('helpC');
    if (helpBtn && helpC) {
      helpBtn.addEventListener('click', function() {
        helpOpen = !helpOpen;
        if (helpOpen) {
          helpC.classList.remove('hidden');
          helpBtn.textContent = 'Close Help';
        } else {
          helpC.classList.add('hidden');
          helpBtn.textContent = 'Help';
        }
      });
    }
    
    var resetBtn = document.getElementById('resetAppBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('Delete ALL data?')) {
          localStorage.removeItem(SK);
          location.reload();
        }
      });
    }
  }, 0);
}

function showCreateModal() {
  var n = now();
  var past = getMostRecentPast();
  var mOpts = '';
  for (var i = 1; i <= n.m; i++) {
    mOpts += '<option value="' + i + '"' + (i === n.m ? ' selected' : '') + '>' + months[i - 1] + '</option>';
  }
  
  var copyHtml = '';
  if (past) {
    copyHtml = '<div class="field cb-w"><input type="checkbox" id="copyNamesChk"><label for="copyNamesChk">Copy names from ' + months[past.month - 1] + ' ' + past.year + '</label></div>';
  }
  
  modal.innerHTML = '<div class="modal-c">' +
    '<h3>Create Account</h3>' +
    '<div class="field"><label>Manager Name *</label><input id="mgrIn" placeholder="Enter name"></div>' +
    '<div class="field"><label>Month</label><select id="monthIn">' + mOpts + '</select></div>' +
    '<div class="field"><label>Year</label><input id="yearIn" type="number" value="' + n.y + '" min="2000" max="' + n.y + '"></div>' +
    copyHtml +
    '<div class="btns"><button class="btn-s" id="createCancelBtn">Cancel</button><button id="createConfBtn">Create</button></div>' +
  '</div>';
  
  modal.classList.remove('hidden');
  
  setTimeout(function() {
    var cancelBtn = document.getElementById('createCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    var confBtn = document.getElementById('createConfBtn');
    if (confBtn) {
      confBtn.addEventListener('click', function() {
        var mgrIn = document.getElementById('mgrIn');
        var monthIn = document.getElementById('monthIn');
        var yearIn = document.getElementById('yearIn');
        var copyChk = document.getElementById('copyNamesChk');
        
        var mgr = mgrIn ? mgrIn.value.trim() : '';
        var m = monthIn ? parseInt(monthIn.value) : 0;
        var y = yearIn ? parseInt(yearIn.value) : 0;
        
        if (!mgr) {
          alert('Manager name required');
          return;
        }
        if (isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 2000 || y > n.y) {
          alert('Invalid month/year');
          return;
        }
        if (y === n.y && m > n.m) {
          alert('Cannot create future month');
          return;
        }
        
        for (var id in accounts) {
          if (accounts.hasOwnProperty(id)) {
            if (accounts[id].month === m && accounts[id].year === y) {
              alert('Account for this month already exists');
              return;
            }
          }
        }
        
        var copyNames = past && copyChk && copyChk.checked;
        
        var acc = {
          id: uid(),
          managerName: mgr,
          month: m,
          year: y,
          createdAt: Date.now(),
          names: [],
          meals: {},
          deposits: {},
          extras: {},
          expenses: [],
          settlements: {}
        };
        
        if (copyNames && past && past.names && past.names.length) {
          for (var j = 0; j < past.names.length; j++) {
            var newId = uid();
            acc.names.push({ id: newId, name: past.names[j].name });
            acc.deposits[newId] = [];
            acc.extras[newId] = [];
          }
        }
        
        accounts[acc.id] = acc;
        save();
        closeModal();
        currentId = acc.id;
        if (m === n.m && y === n.y) {
          renderAccount();
        } else {
          renderLanding();
        }
      });
    }
  }, 0);
}

function renderHistory() {
  var list = getHistory();
  
  app.innerHTML = '<div class="hdr"><button class="btn-s" id="backBtn">← Back</button><h2>History</h2></div>' +
    '<div class="tab-c" id="histList"></div>';
  
  setTimeout(function() {
    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', renderLanding);
    
    var histList = document.getElementById('histList');
    if (!list.length) {
      histList.innerHTML = '<div class="empty">No past accounts</div>';
      return;
    }
    
    var h = '';
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      h += '<div class="hist-card">' +
        '<div class="info"><div class="month">' + months[a.month - 1] + ' ' + a.year + '</div><div class="mgr">' + a.managerName + '</div></div>' +
        '<button class="btn-s hist-open" data-id="' + a.id + '">Open</button>' +
        '<button class="btn-d hist-del" data-del="' + a.id + '">Delete</button>' +
      '</div>';
    }
    histList.innerHTML = h;
    
    var openBtns = document.querySelectorAll('.hist-open');
    for (var j = 0; j < openBtns.length; j++) {
      openBtns[j].addEventListener('click', function() {
        currentId = this.getAttribute('data-id');
        renderAccount();
      });
    }
    
    var delBtns = document.querySelectorAll('.hist-del');
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener('click', function() {
        var delId = this.getAttribute('data-del');
        if (confirm('Delete this account?')) {
          delete accounts[delId];
          save();
          renderHistory();
        }
      });
    }
  }, 0);
}
