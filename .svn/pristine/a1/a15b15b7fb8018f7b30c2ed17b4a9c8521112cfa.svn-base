
jQuery(document).ready(function(a) {
	a(".pollOption:last").live("keydown", function() {
		var b = a(".pollOption").length + 1;
		30 < b || (a(this).after(a("<div>").addClass("pollOption").append(a("<span>").text(b + ".")).append(a("<input>").attr("placeholder", "Enter poll option...").attr("name", "Option " + b))), a(".pollOption:last input").trigger("blur"));
	});
	a("#permissiveVoteExplain").click(function() {
		showAlertBox("By default, Straw Poll will check for duplicate votes based on a given location using an IP address. However, this will cause all users in that location to appear to be one single user. Check this box if you need to be able to have multiple votes from the same location (e.g., a business or school).");
	});
	"placeholder" in document.createElement("input") || (a("input, textarea").live("focus", function() {
		var b = a(this);
		b.hasClass("placeholder") && b.removeClass("placeholder").val("");
	}), a("input, textarea").live("blur", function() {
		var b = a(this), c = b.attr("placeholder");
		(c && !b.val() || b.val() == c) && b.addClass("placeholder").val(c);
	}), a("input, textarea").trigger("blur"));
	var d = !1;
	a("#pollCreateButton").click(function() {
		if (!d) {
			var b = a("#pollHeader textarea"), c = b.val();
			b.attr("placeholder");
			var e = [], f = a(".pollOption:first input").attr("placeholder"), b = a("#pollMulti").is(":checked"), g = a("#pollPermissive").is(":checked");
			a(".pollOption input").each(function() {
				var b = a(this).val();
				b && b != f && e.push(b);
			});
			if (!c || 2 > e.length)
				return alert("Please choose a title and at least two options");
			d = !0;
			a.post("/ajax/new-poll", {
				title : c,
				options : e,
				multi : b,
				permissive : g
			}, function(a) {
				a = Number(a.id);
				a.toString(36);
				showAlertBox('Your poll has been created and is now available at <a href="/' + a + '">http://' + window.location.host + "/" + a + "</a>");
				d = !1;
			}, "json");
		}
	});
}); 