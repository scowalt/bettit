/**
 * This variable prevents mod triggers from happening more than once
 */

$(document).ready(function() {
	io = io.connect();

	addAddEventButton();

	// reserved event, called when connection to server is made
	io.on('connect', function() {
		io.emit('ready', window.threadID); // join this thread's room
	});

	/**
	 * IO Receivers
	 */
	io.on('money_response', function(data) {
		$("#user_money").text(data.money);
	});
	io.on("thread_info_response", function(data) {
		document.title = document.title + " " + data.title;
		$("#thread_title").text(data.title);
		$("#thread_content").html(data.content);
	});
	io.on('event_response', function onEventResponse(data) {
		console.log(data);

		var formID = "event_" + data.id + "_form";

		// if deleting an event
		if (data.status === 'deleted') {
			$("#" + formID).parent().remove();
			return;
		}

		// base form
		var form = $("<form>", {
			'id': formID,
			'class': 'event_form',
			'role': 'form'
		});

		// append outcomes to form
		for (var i = 0; i < data.outcomes.length; i++) {
			var outcome = data.outcomes[i];

			// create radio button
			var input = $("<input>", {
				'type': 'radio',
				'name': 'event_' + data.id + '_radios',
				'id': 'outcome_' + outcome.id,
				'value': 'outcome_' + outcome.id
			});

			// give radio button proper attributes
			if ((data.status == 'closed') ||
				((data.betOn !== false) && (data.status == 'open')) ||
				((data.status == 'locked') && (!(window.mod))))
				input.attr('disabled', true);
			if (data.betOn == outcome.id && !(window.mod && data.status == 'locked'))
				input.attr('checked', true);

			// set outcome's label
			var labelContainer = $("<span>", {
				'class': 'radio',
				'for': 'outcome_' + outcome.id
			});

			var label = $("<span>").text(outcome.title);

			if (data.status == 'closed' && data.betOn == outcome.id && data.winner !== outcome.id)
				label.addClass('label label-danger');
			if (data.status == 'closed' && data.winner == outcome.id)
				label.addClass('label label-success');

			labelContainer.append(label);

			// add badge
			labelContainer.append($("<span>", {
				'class': 'badge'
			}).text(outcome.bets));

			var radio = $("<label>", {
				'class': 'radio inline'
			})

			radio.append(input);
			radio.append(labelContainer);

			// add radio button (with label) to form
			form.append(radio);
		}

		// append bet button
		if (data.status === 'open' && data.betOn === false)
			form.append($("<input>", {
				'type': 'submit',
				'class': "btn btn-primary _bet",
				'value': 'Bet §20'
			}));

		// lock button
		if (window.mod && data.status === 'open') form.append($("<input>", {
			'type': "submit",
			'class': "btn btn-warning _lock",
			'value': 'Lock'
		}));

		// close button
		if (window.mod && data.status === 'locked') form.append($("<input>", {
			'type': 'submit',
			'class': 'btn btn-warning _close',
			'value': 'Close'
		}));

		// delete button
		if (window.mod && data.status !== 'closed') form.append($("<input>", {
			'type': 'submit',
			'class': 'btn btn-danger _delete',
			'value': 'DELETE'
		}));


		var $eventTitleBar = $("<div>", {'class':'row'});
		var $title = $("<div>", {'class':'col-xs-10'}).append($("<h4>").text(data.title));
		var $status = $("<div>", {'class':'col-xs-2'}).text(data.status);

		$eventTitleBar.append($title).append($status);

		// put form inside of div
		var html = $("<div>", {
			'id': "event_" + data.id,
			'class': 'well well-sm'
		}).append($eventTitleBar).append(form);

		// replace event if it's already on the page
		if ($('#event_' + data.id).length)
			$('#event_' + data.id).replaceWith(html);
		// else put the event onto the page
		else
			$("#events").prepend(html);
	});

	/**
	 * HTML for the outcome inputs in the add_event_form
	 * @type {*|jQuery|HTMLElement}
	 */
	var outcome_html = $("<input>", {
		'class': 'form-control add_event_outcome',
		'type': 'text',
		'placeholder': 'Outcome'
	});

	var $add_event_span = $("#add_event_span");

	/**
	 * Handles creating the add event form
	 */
	$(document).on("click", "#add_event_button", function onClick() {
		var event_title = $("<div>", {
			'class': 'form-group col-xs-12'
		}).append($("<input>", {
			'id': 'add_event_title',
			'class': 'form-control',
			'type': 'text',
			'placeholder': 'Event title'
		}).attr('required', 'required'));

		var submit_button = $("<input>", {
			'type': 'submit',
			'class': 'btn btn-primary',
			'value': 'Add Event'
		});

		var form = $('<form>', {
			'class': 'form-horizontal',
			'role': 'form',
			'id': 'add_event_form'
		});

		var outcomeContainer = $('<div>', {
			'class': 'form-group col-xs-12',
			'id': 'outcome-input-container'
		});

		outcomeContainer.append(outcome_html).append(outcome_html.clone().val(''));

		form.append(event_title).append(outcomeContainer)
			.append(submit_button);

		$("#add_event_span").html($("<div>", {
			'class': 'well well-small'
		}).append(form));
	});

	/**
	 * When a mod types into the last outcome input
	 */
	$(document).on("keypress", ".add_event_outcome:last", function onLastOutcomeTyped() {
		$(this).parent().append(outcome_html.clone().val(''));
	});

	/**
	 * When a mod submits a new event
	 */
	$add_event_span.on("submit", "form#add_event_form", function onAddEvent(event) {
		event.preventDefault();
		var $add_event_title = $("#add_event_title");
		var eventTitle = $add_event_title.val();
		var $outcomes = $('.add_event_outcome');
		var outcomes = [];
		$outcomes.each(function() {
			var value = $(this).val();
			if (value !== '') outcomes.push(value);
		});
		if (outcomes.length < 2)
			return; // need at least 2 outcomes
		$add_event_title.val('');
		$outcomes.each(function() {
			$(this).val('');
		});
		io.emit('add_event', {
			threadID: window.threadID,
			title: eventTitle,
			outcomes: outcomes
		});
		addAddEventButton();
	});

	/**
	 * When an existing event is bet on
	 */
	$(document).on("click", "._bet", function onBet(event) {
		event.preventDefault();
		var $form = $(this).parent('form');
		var formID = $form.attr('id');
		var eventID = formID.replace('event_', '').replace('_form', '');
		var outcomeID = null;
		$('#' + formID + ' :checked').each(function() {
			outcomeID = $(this).val().replace('outcome_', '');
		});
		if (outcomeID) io.emit('bet', {
			outcomeID: outcomeID
		});
	});

	/**
	 * When an existing event is locked
	 */
	$(document).on("click", "._lock", function onLock(event) {
		event.preventDefault();
		console.log("Lock clicked");
		var $form = $(this).parent('form');
		var formID = $form.attr('id');
		var eventID = formID.replace('event_', '').replace('_form', '');
		io.emit('lock', {
			eventID: eventID
		});
	});

	/**
	 * When an existing event is closed
	 */
	$(document).on("click", "._close", function onClose(event) {
		event.preventDefault();
		var $form = $(this).parent('form');
		var formID = $form.attr('id');
		var eventID = formID.replace('event_', '').replace('_form', '');
		var outcomeID = null;
		$('#' + formID + ' :checked').each(function() {
			outcomeID = $(this).val().replace('outcome_', '');
		});
		if (outcomeID) io.emit('close', {
			eventID: eventID,
			outcomeID: outcomeID
		});

	});

	/**
	 * When an existing event is deleted
	 */
	$(document).on("click", "._delete", function onDelete(event) {
		event.preventDefault();
		var $form = $(this).parent('form');
		var formID = $form.attr('id');
		var eventID = formID.replace('event_', '').replace('_form', '');
		io.emit('delete', eventID);
	})
});

/**
 * Replaces content of add_event_span with just the Add Event button
 */
function addAddEventButton() {
	$('#add_event_span').html('' + '<button ' +
		'id="add_event_button" ' +
		'class="btn btn-large btn-block btn-primary"' +
		' type="button">Add event</button><br/>');
}