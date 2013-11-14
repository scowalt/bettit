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
				id       : '123456',
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
				id       : '234567',
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
					if(t)
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
					var event = { title : "event title" };
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
						title : "Thing 1 will happen"
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

	describe('A bet', function(){
		describe('with valid information', function(){
			var bet = {
				amount : 50
			};

			describe('when added to the database', function(){
				before(function(done){
					db.Bet.create(bet).success(function(b){
						bet.id = b.values.id;
						done();
					});
				});

				describe('when assigned a user and outcome', function(){
					var user = {
						id       : '124j2sz',
						username : 'testuser3'
					};
					var outcome = {
						title : 'bet outcome title'
					};

					before(function(done){
						db.User.create(user).success(function(u){
							user.id = u.values.id;
							db.Outcome.create(outcome).success(function(o){
								outcome.id = o.values.id;
								db.Bet.find(bet.id).success(function(b){
									u.addBet(b).success(function(){
										o.addBet(b).success(function(){
											done();
										});
									});
								});
							});
						});
					});

					it('bet will appear as a bet of the outcome', function(done){
						db.Outcome.find(outcome.id).success(function(o){
							o.getBets().success(function(bets){
								assert.equal(bets.length, 1);
								assert.equal(bets[0].id, bet.id);
								done();
							})
						});
					});

					it('bet will appear as a bet of the user', function(done){
						db.User.find({where : user}).success(function(u){
							u.getBets().success(function(bets){
								assert.equal(bets.length, 1);
								assert.equal(bets[0].id, bet.id);
								done();
							})
						});
					})

					it('user will appear as owner of the bet', function(done){
						db.Bet.find(bet.id).success(function(b){
							b.getUser().success(function(u){
								assert.equal(u.id, user.id);
								done();
							});
						})
					});

					it('outcome will appear as owner of the bet', function(done){
						db.Bet.find(bet.id).success(function(b){
							b.getOutcome().success(function(o){
								assert.equal(o.id, outcome.id);
								done();
							});
						})
					})

					after(function(done){
						db.User.find({where : user}).success(function(u){
							u.destroy().success(function(){
								db.Outcome.find(outcome.id).success(function(o){
									o.destroy().success(function(){
										done();
									});
								});
							});
						});
					});
				});

				after(function(done){
					db.Bet.destroy(bet.id).success(function(){
						done();
					});
				});
			});
		});
	});
});