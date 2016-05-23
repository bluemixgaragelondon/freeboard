var persistDashboard = function(_thisref, event) {
  var username = 'radiator';
  var password = prompt('Enter radiator password', '');
  var basicAuth = 'Basic ' + btoa(username +':' + password);

  var dashboard = freeboard.serialize();
  fetch('/board/dashboard.json', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': basicAuth
    },
    body: JSON.stringify(dashboard)
  })
  .then(function(result) {
    console.log(result);
    if(result.ok) {
      alert('Save Complete');
    } else {
      throw result.status;
    }
  })
  .catch(function(err){
    var err = JSON.stringify(err);
    console.log(err);
    alert(err);
  });
};

var persistBtn = '<li id="persist-dashboard" data-bind="click: persistDashboard"><i class="icon-download-alt icon-white"></i><label>Persist Dashboard</label></li>';
$('.board-toolbar.vertical').append(persistBtn);
