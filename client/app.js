(function(){
  $(document).on('ready', function(){
    var options = {
      placement: 'top',
      template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
      title: 'Allow others to see your checklist in the Recent list?',
      trigger: 'hover focus'
    }
    $('.private').tooltip(options);

  });
  
  var app = angular.module('app', []);

  app.controller('MainCtrl', function($scope, $http, $location){
    $scope.alerts = [];
    $scope.creatingNewChecklist = false;
    $scope.newChecklist = new Checklist();
    $scope.recentLists;
    $scope.currentChecklist;
    
    //Returns whether there is an active poll or newPoll
    $scope.anyActive = function(){
      return ($scope.creatingNewChecklist || $scope.currentChecklist);
    }
    
    //Changes the $location
    $scope.goto = function(loc){
      $location.path(loc);
    }
    
    //Clear $scope.newChecklist and currentCheckList
    $scope.startNewCheckList = function(){
      $scope.creatingNewChecklist = !$scope.creatingNewChecklist;
    }
    
    //function to check items in $scope.currentChecklist.list accepts index of check
    $scope.checkItem = function(ind){
      if ($scope.currentChecklist.list && $scope.currentChecklist.list[ind]){
        $scope.currentChecklist.list[ind].check =! $scope.currentChecklist.list[ind].check;
      }
      $scope.updateSaves();
    }
    
    //Add an item to $scope.alerts
    $scope.addAlert = function(title, text, type){
      $scope.alerts.push(new CustomError(title, text, type));
    }
    
    //Remove an item from $scope.alerts using index
    $scope.removeAlert = function(index){
      $scope.alerts.splice(index, 1);
    }
    
    //Adds a new list item to newChecklist.list
    $scope.addItemToNew = function(){
      $scope.newChecklist.addItem();
    }
    
    //removes a list item from newChecklist.list using its index
    $scope.removeItemFromNew = function(index){
      $scope.newChecklist.removeItem(index);
    }
    
    //run on $scope.currentChecklist.list item change
    $scope.updateSaves = function(){
      if ($scope.currentChecklist){
        saveToLocalStorage($scope.currentChecklist);
      }
    };
    
    //Send checklist to server
    $scope.saveNewChecklist = function(){
      delete $scope.newChecklist._id;
      $scope.newChecklist.createrId = getCreaterId();
      $http.post('/api', $scope.newChecklist)
        .then(function(res){
          if (!uuidValid(getCreaterId())){
            saveCreaterId(res.data.createrId);
          }
          setLocation(res.data._id);
          $scope.creatingNewChecklist = false;
          $scope.newChecklist = new Checklist();
          $scope.currentChecklist = res.data;
        })
        .catch(function(err){
          if(err.data.err){
            $scope.addAlert('Failed', err.data.err, 'danger');
          } 
        });
    }
    
    $scope.$on('$locationChangeSuccess', function(){
      onInit();
    });
    
    //Run on load
    function onInit(){
      if (getLocation()){
        $http.get('/api/'+getLocation())
          .then(function(res){ 
            $scope.currentChecklist = parseList(res.data);
          })
          .catch(function(err){
            console.log(err);
          })
      } else {
        delete $scope.currentChecklist;
        if (!$scope.recentLists){
          $http.get('/api/recentChecklists')
            .then(function(res){
              $scope.recentLists = res.data;
            })
            .catch(function(err){
              console.log(err);
          })
        }
      }
    }
    
    //Get info from localstorage on currentChecklist and load previous values
    function parseList(obj){
      var list = loadFromLocalStorage(obj._id);
      if(!list.listVal){
        return obj;
      }
      for (var i = 0, len = list.listVal.length; i < len; i++){
        (list.listVal[i] == 1) ? obj.list[i].check = true : obj.list[i].check = false;
      }
      return obj;
    }
    
    //Convert array to string for smaller storage
    function convertList(list){
      var str = '';
      var len = list.length;
      for (i = 0; i < len; i++){
        (list[i].check) ? str += 1 : str += 0; 
      }
      return str;
    }
    
    //Set the path using $location
    function setLocation(id){
      $location.path('/'+id);
    }
    
    //Get the path using $location
    function getLocation(){
      return $location.path().substr(1);
    }
    
    
    //Check if createrId in storage
    function getCreaterId(){
      return localStorage.getItem('createrId');
    }
    
    //Save createrId to storage
    function saveCreaterId(id){
      localStorage.setItem('createrId', id);
    }
    
    //Save Checklist Data to Storage
    function saveToLocalStorage(obj){
      var toSave = {
        listVal: convertList(obj.list)
      };
      if (obj.createrId){
        toSave.createrId = obj.createrId;
      }
      var jsonObj = JSON.stringify(toSave);
      if ('_id' in obj){
        localStorage.setItem(obj._id, jsonObj);
      }
    }
    
    //Get Checklist Data from Storage
    function loadFromLocalStorage(id){
      var lsObject = localStorage.getItem(id);
      if (lsObject){
        return JSON.parse(lsObject);
      }
      return {};
    }
  });
  
  //Validate UUID's
  function uuidValid(uuid){
    var reg = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4{1}[a-fA-F0-9]{3}-[89abAB]{1}[a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;
    return reg.test(uuid);
  }
  
  //Error Prototype
  // title : string
  // text : string
  // type : string
  function CustomError(title, text, type){
    this.title = title || 'Error';
    this.text = text || '';
    this.type = type || 'danger';
  }
  
  //New Checklist Prototype
  function Checklist(_id, title, date, list){
    this._id = _id || null;
    this.title = title || '';
    this.date = date || null;
    this.list = list || [{text: '', check: false}, {text: '', check: false}];
  }
  
  Checklist.prototype.addItem = function(){
    var num = this.list.length+1;
    this.list.push({text: '', check: false});
  };
  
  Checklist.prototype.removeItem = function(index){
    this.list.splice(index, 1);
  };
})()
