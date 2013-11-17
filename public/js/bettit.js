/**
 * This variable prevents mod triggers from happening more than once
 */

$(document).ready(function(){
	io = io.connect();

	addAddEventButton();

	// reserved event, called when connection to server is made
	io.on('connect', function(){
		io.emit('ready', window.threadID); // join this thread's room
	});

	/**
	 * IO Receivers
	 */
	io.on('money_response', function(data){
		$("#user_money").text(data.money);
	});
	io.on("thread_info_response", function(data){
		document.title = document.title + " " + data.title;
		$("#thread_title").text(data.title);
		$("#thread_content").html(data.content);
	});
	io.on('event_response', function(data){
		console.log(data);

		// base form
		var form = $("<form>", {
			'id'    : "event_" + data.id + "_form",
			'class' : 'event_form'
		});

		// append outcomes to form
		for (var i = 0; i < data.outcomes.length; i++) {
			var outcome = data.outcomes[i];
			var radio = $("<input>", {
				'type'  : 'radio',
				'name'  : 'event_' + data.id + '_radios',
				'id'    : 'outcome_' + outcome.id,
				'value' : 'outcome_' + outcome.id
			});
			if (data.betOn !== false)
				radio.attr('disabled', true);
			if (data.betOn === outcome.id)
				radio.attr('checked', true);
			form.append($("<label>", {'class' : 'radio'}).text(outcome.title)
				.prepend(radio));
		}

		// append buttons to form
		if (data.status === 'open' && data.betOn === false)
			form.append($("<input>", {
				'type'  : 'submit',
				'class' : "btn btn-primary bet",
				'value' : 'Bet §20'
			}));
		if (window.mod && data.status === 'open') form.append($("<input>", {
			'type' : "submit", 'class' : "btn btn-warning", 'value' : 'Lock'
		}));

		// put form inside of div
		var html = $("<div>", {
			'id'    : "event_" + data.id,
			'class' : 'well well-small'
		}).append($('<h5>').text(data.title)).append(form);

		// put the div onto the page
		$("#events").prepend(html);
	});

	/**
	 * Handles creating the add event form
	 */
	$(document).on("click", "#add_event_button", function(){
		var event_title_html = $("<input>", {
			'id'          : 'add_event_title',
			'class'       : 'input-block-level',
			'type'        : 'text',
			'placeholder' : 'Event title'
		}).attr('required', 'required');
		var submit_button_html = $("<input>", {
			'type'  : 'submit',
			'class' : 'btn btn-primary',
			'value' : 'Add Event'
		});

		$("#add_event_span").html($("<div>",
			{'class' : 'well well-small'}).append($("<form>",
				{'id' : 'add_event_form'}).append(event_title_html)
				.append(outcome_html).append(outcome_html.clone().val(''))
				.append(submit_button_html)));
	});

	/**
	 * HTML for the outcome inputs in the add_event_form
	 * @type {*|jQuery|HTMLElement}
	 */
	var outcome_html = $("<input>", {
		'class'       : 'input-block-level add_event_outcome',
		'type'        : 'text',
		'placeholder' : 'Outcome'
	});

	var $add_event_span = $("#add_event_span");

	/**
	 * When a mod types into the last outcome input
	 */
	$add_event_span.on("keypress", ".add_event_outcome:last", function(){
		$(this).after(outcome_html.clone().val(''));
	});

	/**
	 * When a mod submits a new event
	 */
	$add_event_span.on("submit", "form#add_event_form", function(event){
		event.preventDefault();
		var $add_event_title = $("#add_event_title");
		var eventTitle = $add_event_title.val();
		$add_event_title.val('');
		var $outcomes = $('.add_event_outcome');
		var outcomes = [];
		$outcomes.each(function(){
			var value = $(this).val();
			$(this).val('');
			if (value !== '') outcomes.push(value);
		});
		io.emit('add_event', {
			threadID : window.threadID,
			title    : eventTitle,
			outcomes : outcomes
		});
		addAddEventButton();
	});

	/**
	 * When an existing event is bet on
	 */
	$(document).on("click", ".bet", function(event){
		event.preventDefault();
		var $form = $(this).parent('form');
		var formID = $form.attr('id');
		var eventID = formID.replace('event_', '').replace('_form', '');
		var outcomeID = null;
		$('#' + formID + ' :checked').each(function(){
			outcomeID = $(this).val().replace('outcome_', '');
		});
		if (outcomeID) io.emit('bet', {
			outcomeID : outcomeID
		})
	});
});

/**
 * Replaces content of add_event_span with just the Add Event button
 */
function addAddEventButton(){
	$('#add_event_span').html('' + '<button ' +
		'id="add_event_button" ' +
		'class="btn btn-large btn-block btn-primary"' +
		' type="button">Add event</button><br/>');
}