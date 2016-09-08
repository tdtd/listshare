'use strict';
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;
var connection = mongoose.connect('mongodb://localhost/lister');
var uuid = require('uuid');
var Promise = require("bluebird");
/*
  Save and Load Data from Mongo so you don't have to check in all the damn time ya dingus.
*/
var checklistSchema = new Schema({
  _id: {
    type: String,
    'default': shortid.generate 
  },
  created: {
    type: Date,
    default: new Date()
  },
  title: {
    type: String
  },
  list: {
    type: Array,
    default: []
  },
  createrId: {
    type: String,
    default: uuid.v4,
    select: false
  },
  private: {
    type: Boolean,
    default: false
  }
})

checklistSchema.statics = {
  loadPollById: function(id) {
    var self = this;
    return new Promise(function(resolve, reject){
      self.findById(id)
        .populate('-createrID -__v')
        .exec(function(err, post){
        if (err){
          return reject(err);
        } 
        return resolve(post);
      });
    })
  },
  loadRecentPublic: function() {
    var self = this;
    return new Promise(function(resolve, reject){
      self.find({private: false})
        .populate('-createrID -__v')
        .limit(10)
        .sort('-created')
        .exec(function(err, post){
        if (err){
          return reject(err);
        } 
        return resolve(post);
      });
    })
  },
};

var Checklist = mongoose.model('Checklist', checklistSchema);

module.exports = Checklist;
