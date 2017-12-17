$(document).ready ()->
  connection_failed = undefined
  $("#seating_plan").submit ->
    $("#waiting").fadeIn "slow"
    connection_failed = setTimeout ->
      $("#error_message").html "Connection seems to have failed.<br/>Try again, or email pixelsallover@gmail.com."
      $("#waiting").fadeOut "slow"
      $("#error").dialog "open"
    ,
      10000
  $("#seating_plan").iframer
    onComplete: (data)->
      $("#waiting").fadeOut "fast"
      clearTimeout connection_failed
      data = (JSON.parse data) || error: "No data from server."
      if data.error?
        $("#error_message").html data.error.replace "\n\t", "<br/><br/>"
        $("#error").dialog "open"
      else if data.plan_pdf? and data.stickers_pdf?
        $("#plan_pdf").attr("href", data.plan_pdf).button()
        $("#stickers_pdf").attr("href", data.stickers_pdf).button()
        $("#success").dialog("option", "title", "Download: <em>#{$("#center").val()}</em>").dialog "open"
        $("#plan_pdf").blur()
  
  $("#main").accordion
    header: "h3"
    animated: "easeOutExpo"
    icons:
      header: "ui-icon-carat-1-e"
      headerSelected: "ui-icon-carat-1-s"
    navigation: true
    autoHeight: false
  $("#main input:submit").button()

  ## Styling
  $("div.inputs div").addClass("ui-corner-all").click ->
    $("label", $(this)).focus()

  options =
    autoOpen: false
    show: "drop"
    hide: "explode"
    resizable: false
    width: 380
    modal: true
  $("#error").dialog options
  $("#success").dialog options

  $("#screen").fadeOut "slow"
