$('#toc').toc();
$('#toc').prepend($('#title-template').html());

var locationParts = location.href.split('/'),
  topicName = locationParts[locationParts.length - 2];
$('title').text($('title').text() + ': ' + topicName);
$('.title').text(topicName);