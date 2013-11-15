var event_title_html = $("<input>", {
	'id'          : 'add_event_title',
	'class'       : 'input-block-level',
	'type'        : 'text',
	'placeholder' : 'Event title'
}).attr('required', 'required');
var outcome_html = $("<input>", {
	'class'       : 'input-block-level add_event_outcome',
	'type'        : 'text',
	'placeholder' : 'Outcome'
});
var submit_button_html = $("<input>", {
	'type'  : 'submit',
	'class' : 'btn btn-primary',
	'value' : 'Add Event'
});
var mod = false;

$(document).ready(function(){
	io = io.connect();

	$(".event_form").each(function(index){
		var $form = $(this);
		$form.submit(function(event){
			event.preventDefault();
			var id = $form.attr('id');
			var search = '#' + id + ' input:checked';
			$(search).each(function(index){
				console.log($(this));
			})
		});
	});

	/**
	 * IO Emits
	 */
	io.emit('ready');
	io.emit('thread_info');
	io.emit('is_mod');
	io.emit('get_events');

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
	io.on('is_mod_response', function(data){
		if(!mod)
			$('#add_event_span').html('' + '<button ' +
				'id="add_event_button" ' +
				'class="btn btn-large btn-block btn-primary"' +
				' type="button">Add event</button><br/>');
	});

	$(document).on("click", "#add_event_button", function(){
		$("#add_event_span").html($("<div>",
			{'class' : 'well well-small'}).append($("<form>",
				{'id' : 'add_event_form'}).append(event_title_html)
				.append(outcome_html).append(outcome_html.clone().val(''))
				.append(submit_button_html)));

		$("#add_event_span").on("keypress", ".add_event_outcome:last", function(){
			$(this).after(outcome_html.clone().val(''));
		});

		$("#add_event_span").on("submit", "form#add_event_form", function(event){
			event.preventDefault();
			var eventTitle = $("#add_event_title").val();
			var $outcomes = $('.add_event_outcome');
			var outcomes = [];
			$outcomes.each(function(){
				var value = $(this).val();
				if(value !== '') outcomes.push(value);
			})
			io.emit('add_event', {

			});
		})
	})
});