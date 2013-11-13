var assert = require("assert");
var prefs = require('../config/prefs.js');
var db = require('../models')('test', false);

describe('Database tests:', function(){
	before(function(done){
		db.sequelize.sync({force : true}).success(function(){
			done();
		});
	});

	describe('A user', function(){
		describe('with a username and money amount', function(){
			var user = {
				username : 'testuser',
				money    : 475
			};

			describe('when added to the database', function(){

				before(function(done){
					db.User.create(user).success(function(){
						done();
					});
				});

				describe('when set as the moderater of a thread', function(){
					var thread = {
						id : 'asdf12'
					};

					before(function(done){
						db.Thread.create(thread).success(function(t){
							db.User.find({
								where : user
							}).success(function(u){
									t.addUser(u).success(function(){
										done();
									});
								});
						});
					});

					it('should appear as the moderator of the thread', function(done){
						db.Thread.find({
							where : thread
						}).success(function(t){
								t.getUsers().success(function(moderators){
									assert.equal(moderators[0].username, user.username);
									done();
								});
							});
					});

					it('the thread should appear under the user\'s moderated threads', function(done){
						db.User.find({
							where : user
						}).success(function(u){
								u.getThreads().success(function(threads){
									assert.equal(threads[0].id, thread.id);
									done();
								});
							});
					});

					after(function(done){
						db.Thread.destroy(thread).success(function(){
							done();
						});
					});
				});

				it('should be in the database with the correct money value', function(done){
					db.User.find({
						where : user
					}).success(function(info){
							assert.equal(user.money, info.money);
							assert.equal(user.username, info.username);
							done();
						});
				});

				after(function(done){
					db.User.destroy(user).success(function(){
						done();
					});
				});

			});
		});
		describe('with a username and no money amount', function(){
			var user = {
				username : 'testuser'
			};

			describe('when added to the database', function(){
				before(function(done){
					db.User.create(user).success(function(){
						done();
					});
				});

				it('should be in the database with the default money value', function(done){
					db.User.find({
						where : user
					}).success(function(info){
							assert.equal(user.username, info.username);
							assert.equal(prefs.default_money, info.money);
							done();
						});
				});

				after(function(done){
					db.User.destroy(user).success(function(){
						done();
					});
				});
			});
		});
		describe('with no information', function(){
			var user = {
				/* empty */
			};

			it("can't be added to the database", function(done){
				db.User.create(user).error(function(){
					done();
				});
			});
		});
	});

	describe('A thread', function(){
		describe('with valid information', function(){
			var thread = {
				id : 'atqr2e'
			};

			describe('when added to the database', function(){
				before(function(done){
					db.Thread.create(thread).success(function(){
						done();
					});
				});

				describe('when an event is added', function(){
					var event = { title: "event title" };
					before(function(done){
						db.Event.create(event).success(function(e){
							event.id = e.values.id;
							db.Thread.find({where : thread}).success(function(t){
								t.addEvent(e).success(function(){
									done();
								});
							});
						});
					});

					it('event should appear under thread\'s events', function(done){
						db.Thread.find({where : thread}).success(function(t){
							t.getEvents().success(function(events){
								assert.equal(events.length, 1);
								assert.equal(event.title, events[0].values.title);
								done();
							}).error(function(error){
									done(error);
								});
						});
					});

					it('thread should appear as event\'s owner', function(done){
						db.Event.find(event.id).success(function(e){
							e.getThread().success(function(t){
								assert.equal(t.id, thread.id);
								done();
							}).error(function(err){
									done(err);
								});
						}).error(function(err){
								done(err);
							});
					});

					after(function(done){
						db.Event.find(event.id).success(function(e){
							e.destroy().success(function(){
								done();
							})
						}).error(function(err){
								done(err);
							});
					});
				});

				it('should be in the database with the correct information', function(done){
					db.Thread.find({
						where : thread
					}).success(function(info){
							assert.equal(info.id, thread.id);
							done();
						});
				});

				after(function(done){
					db.Thread.destroy(thread).success(function(){
						done();
					});
				});
			});
		});
	});

	describe('An event', function(){
		describe('with valid information', function(){
			var event = {
				title : "Event title!"
			};

			describe('when added to the database', function(){
				before(function(done){
					db.Event.create(event).success(function(e){
						event.id = e.values.id;
						db.Event.find(event.id).success(function(){
							done();
						})
					}).error(function(err){
							done(err);
						});
				});

				it('appears in the database with correct information', function(done){
					db.Event.find(event.id).success(function(e){
						assert.equal(e.id, event.id);
						assert.equal(e.title, event.title);
						done();
					});
				});
			});


		});
	});
});
