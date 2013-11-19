var assert = require("assert");
var prefs = require('../config/prefs.js');
var db = require('../models')('test', false);

describe('Database tests:', function(){
	before(function(done){
		db.sequelize.sync({force : true}).success(function(){
			done();
		}).error(function(error){
				throw error;
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
							db.User.find({where : user}).success(function(u){
								t.addUser(u).success(function(){
									done();
								});
							});
						});
					});

					it('should appear as the moderator of the thread',
						function(done){
							db.Thread.find({
								where : thread
							}).success(function(t){
									t.getUsers().success(function(moderators){
										assert.equal(moderators[0].username,
											user.username);
										done();
									});
								});
						});

					it('the thread should appear under the user\'s moderated threads',
						function(done){
							db.User.find({
								where : user
							}).success(function(u){
									u.isModeratorOf(thread.id, function(bool){
										assert.equal(bool, true);
										done();
									})
								});
						});

					after(function(done){
						db.Thread.destroy(thread).success(function(){
							done();
						});
					});
				});

				it('should be in the database with the correct money value',
					function(done){
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

				it('should be in the database with the default money value',
					function(done){
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

			it('cannot be found before being added to the database', function(done){
				db.Thread.find({where : thread}).success(function(t){
					if (t)
						throw "Shouldn't be in database";
					else
						done();
				});
			});

			describe('when added to the database', function(){
				before(function(done){
					db.Thread.create(thread).success(function(){
						done();
					});
				});

				describe('when an event is added', function(){
					var event = { title : "event title", status : "open" };
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
									throw error;
								});
						});
					});

					it('thread should appear as event\'s owner', function(done){
						db.Event.find(event.id).success(function(e){
							e.getThread().success(function(t){
								assert.equal(t.id, thread.id);
								done();
							}).error(function(err){
									throw err;
								});
						}).error(function(err){
								throw err;
							});
					});

					after(function(done){
						db.Event.find(event.id).success(function(e){
							e.destroy().success(function(){
								done();
							})
						}).error(function(err){
								throw err;
							});
					});
				});

				it('should be in the database with the correct information',
					function(done){
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
				title  : "Event title!",
				status : 'open'
			};

			describe('when added to the database', function(){
				before(function(done){
					db.Event.create(event).success(function(e){
						event.id = e.values.id;
						db.Event.find(event.id).success(function(){
							done();
						})
					}).error(function(err){
							throw err;
						});
				});

				it('appears in the database with correct information',
					function(done){
						db.Event.find(event.id).success(function(e){
							assert.equal(e.id, event.id);
							assert.equal(e.title, event.title);
							done();
						});
					});

				describe('when an outcome is added to the event', function(){
					var outcome = {
						title : "Thing 1 will happen",
						order : 0
					};

					before(function(done){
						db.Outcome.create(outcome).success(function(o){
							outcome.id = o.values.id;
							db.Event.find(event.id).success(function(e){
								e.addOutcome(o).success(function(){
									done();
								});
							});
						});
					});

					it('the outcome will belong to the event', function(done){
						db.Event.find(event.id).success(function(e){
							e.getOutcomes().success(function(outcomes){
								assert.equal(outcomes.length, 1);
								assert.equal(outcomes[0].title, outcome.title);
								assert.equal(outcomes[0].id, outcome.id);
								done();
							});
						});
					});

					it('the event will be the owner of the outcome', function(done){
						db.Outcome.find(outcome.id).success(function(o){
							o.getEvent().success(function(owner){
								assert.equal(owner.id, event.id);
								assert.equal(owner.title, event.title);
								done();
							});
						});
					});
				});
			});


		});
	});

	describe('Given a user', function(){
		var userInfo = {
			username : 'testuser01',
			money    : 500
		};

		before(function(done){
			db.User.create(userInfo).success(function(user){
				if (!user) return;
				userInfo.id = user.values.id;
				done();
			})
		});

		describe('and a thread', function(){
			var threadInfo = {
				id : 'qwerty2'
			};

			before(function(done){
				db.Thread.create(threadInfo).success(function(thread){
					if (!thread) return;
					done();
				});
			});

			describe('and an open event in the thread with outcomes', function(){
				var eventInfo = {
					title  : 'Event test title',
					status : 'open'
				};
				var outcome1Info = {
					title : 'outcome 1',
					order : 0
				};
				var outcome2Info = {
					title : 'outcome 2',
					order : 1
				};

				before(function(done){
					db.Event.create(eventInfo).success(function(event){
						db.Outcome.create(outcome1Info).success(function(outcome1){
							outcome1Info.id = outcome1.values.id;
							db.Outcome.create(outcome2Info).success(function(outcome2){
								outcome2Info.id = outcome2.values.id;
								eventInfo.id = event.values.id;
								event.addOutcome(outcome1).success(function(){
									event.addOutcome(outcome2).success(function(){
										done();
									});
								});
							});
						});
					});
				});

				it('the pot of the event is zero (no bets yet)', function(done){
					db.Event.find({where : eventInfo}).success(function(event){
						event.calculatePot(function(pot){
							assert.equal(pot, 0);
							done();
						})
					});
				});

				it('emitEvent() gives the proper output', function(done){
					db.Event.find({where : eventInfo}).success(function(event){
						event.emitEvent(function(data){
							assert.equal(data.status, eventInfo.status);
							assert.equal(data.winner, undefined);
							assert.equal(data.title, eventInfo.title);
							assert.equal(data.id, eventInfo.id);
							assert.equal(data.status, eventInfo.status);
							assert.equal(data.outcomes[0].title, outcome1Info.title);
							assert.equal(data.outcomes[0].id, outcome1Info.id);
							assert.equal(data.outcomes[0].order, outcome1Info.order);
							assert.equal(data.outcomes[1].title, outcome2Info.title);
							assert.equal(data.outcomes[1].id, outcome2Info.id);
							assert.equal(data.outcomes[1].order, outcome2Info.order);
							done();
						});
					});
				});

				describe('when the user bets on outcome 1', function(){
					var amount = 50;

					before(function(done){
						db.User.find({where : userInfo}).success(function(user){
							db.Outcome.find({where : outcome1Info}).success(function(outcome){
								db.Bet.createBet(outcome, user, amount,
									function(error){
										if (error) throw error;
										done();
									});
							});
						});
					});

					it('the user has the correct amount of money', function(done){
						db.User.find({where : {id : userInfo.id}}).success(function(user){
							assert.equal(userInfo.money - amount, user.values.money);
							done();
						});
					});
				})
			});

			describe('where the user moderates the thread', function(){
				before(function(done){
					db.User.find(userInfo.id).success(function(user){
						db.Thread.find({where : threadInfo}).success(function(thread){
							user.addThread(thread).success(function(){
								done();
							});
						});
					});
				});

				it('the user appears as a moderator of the thread', function(done){
					db.User.find(userInfo.id).success(function(user){
						user.getThreads().success(function(threads){
							for (var i = 0; i < threads.length; i++) {
								var thread = threads[i];
								if (thread.values.id === threadInfo.id)
									done()
							}
						});
					});
				});
			});
		});
	})
});