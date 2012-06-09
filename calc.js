var stats = {};
var init_view = function() {
    Object.keys(stats).forEach(function(attr) {
        $('#equip').append(ich.equipRow({attr:attr, base: stats[attr]}));
    }, this);
}

var save = function() {
    localStorage.setItem('mychar', JSON.stringify(stats));
}

var on_update = function() {
    Object.keys(stats).forEach(function(attr) {
        stats[attr] = parseFloat($('#up_' + attr).val());
        $('#char_' + attr).val(stats[attr]);
        $('#' + attr).val("");
        $('#new_' + attr).val("");
    }, this);
    set_base_stats(stats);
    localStorage.setItem('mychar', JSON.stringify(stats));
    update_stats();
}

var avg_dmg = function(hand, stats) {
    var min = stats[hand + '_min'] + stats['dmg_bonus_min'];
    var max = stats[hand + '_max'] + stats['dmg_bonus_max'];
    return (min + max) / 2;
}

var is_dual = function(stats) {
    return stats['off_max'] > 0;
}

var calc_dmg = function(selector, stats) {
    var main_attr = $("#main_attr").val();
    var S = (stats[main_attr]/100) + 1;
    var C = stats['crit_chance'] * stats['crit_bonus'] + 1;
    var A = avg_dmg("main",stats);
    var M = 1;
    var dmg = S*C*A*M;
    if (is_dual(stats)) {
        dmg += avg_dmg("off", stats);
        dmg = dmg / 2;
        dmg = dmg * 1.15;
    }

    $(selector).html(dmg);
    var chg = $('#new_dmg').html() - $('#dmg').html();
    $('#chg_dmg').html(chg);
    $('#chg_dmg').toggleClass('up', chg > 0);
    $('#chg_dmg').toggleClass('down', chg < 0);
}

var calc_reduction = function(selector, stats) {
    var res = stats['base_res'] + stats['int'] * 0.10;
    var armor = stats['base_armor'] + stats['str'];
    var level = parseInt($("#level").val());
    var phys = armor / (50 * level + armor);
    var elem = res / (5 * level + res);
    var reduction = 1 - ((1-phys) * (1-elem));

    $(selector).html(reduction);
}

var calc_ehp = function() {
    var ehp = $('#health').html() / (1 - $('#reduction').html());
    var new_ehp = $('#new_health').html() / (1 - $('#new_reduction').html());

    $('#ehp').html(ehp);
    $('#new_ehp').html(new_ehp);
    var chg = new_ehp - ehp;
    $('#chg_ehp').html(chg);
    $('#chg_ehp').toggleClass('up', chg > 0);
    $('#chg_ehp').toggleClass('down', chg < 0);
}

var calc_health = function(selector, stats) {
    var level = parseInt($("#level").val());
    var base_life = 36 + 4 * level + (level-25) * stats['vit'];
    var max_life = (1 + stats['life']/100) * base_life;
    $(selector).html(max_life);
}

var set_base_stats = function(stats) { 
    stats['base_armor'] = stats['armor'] - stats['str'];
    stats['base_res'] = stats['res'] - stats['int'] * 0.1;
}

var recalc_base_stats = function(stats) {
   stats['armor'] += parseFloat($("#chg_str").val());
   stats['res'] += parseFloat($("#chg_int").val()) * 0.1;
   var old_off = parseInt($("#char_off_max").val());
   if (old_off && !is_dual(stats)) { 
       stats['aps'] /= 1.15;
   } else if (!old_off && is_dual(stats)) {
       stats['aps'] *= 1.15;
   }
   set_base_stats(stats);
}

var on_equip_change = function() {
    var new_stats = $.extend({}, stats);
    Object.keys(new_stats).forEach(function(attr) {
        var change = ($('#new_' + attr).val() - $('#' + attr).val())
        $('#chg_' + attr).val(change);
        new_stats[attr] += change 
    }, this);
    recalc_base_stats(new_stats);

    calc_health('#new_health', new_stats);
    calc_dmg('#new_dmg', new_stats);
    calc_reduction('#new_reduction', new_stats);
    calc_ehp();
    Object.keys(new_stats).forEach(function(attr) {
        $('#up_' + attr).val(new_stats[attr]);
    }, this);
}

var update_stats = function() {
    Object.keys(stats).forEach(function(attr) {
        stats[attr] = parseFloat($('#char_' + attr).val());
    }, this);
    set_base_stats(stats);
    calc_health("#health", stats);
    calc_dmg("#dmg", stats);
    calc_reduction('#reduction', stats);
    on_equip_change(); 
    save();
}

$(document).ready(function() {
    if (localStorage.getItem('mychar')) {
        stats = JSON.parse(localStorage.getItem('mychar'));
    } else {
        stats = TemplateCharacter
    } 
    set_base_stats(stats);

    init_view();

    update_stats();
    $("#equip").delegate(":input", "change", update_stats);
    $("#update").click(on_update);
});
