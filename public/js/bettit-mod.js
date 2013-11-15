var event_title_html = $("<input>", {
	'id'          : 'add_event_title',
	'class'       : 'input-block-level',
	'type'        : 'text',
	'placeholder' : 'Event title'
})
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

$(document).ready(function(){
	$(document).on("click", "#add_event_button", function(){
		$("#add_event_span").html($("<div>",
			{'class' : 'well well-small'}).append($("<form>",
				{'id' : 'add_event_form'}).append(event_title_html)
				.append(outcome_html).append(outcome_html.clone()).append(submit_button_html)));

		$("#add_event_span").on("keypress", ".add_event_outcome:last",
			function(){
				console.log("Called last keypress function");
				$(this).after($("<input>", {
					'id'          : 'add_event_outcome',
					'class'       : 'input-block-level add_event_outcome',
					'type'        : 'text',
					'placeholder' : 'Outcome'
				}))
			});
	})
});