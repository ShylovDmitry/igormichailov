var XML_FILE = 'data/a175.xml';

var SiteManager = (function() {
	var dataManager = null;
    var lastProjectType = 'all';
	var shouldOpenFirstProjectOnLoad = true;

	function init() {
		dataManager = new DataManager(loadDataSuccess);
		dataManager.load();
	}

	function drawProjects(type) {
		if ($('.projects-list.type-' + type).length > 0) {
			return false;
		}

		var projects = dataManager.getProjects(type);
		var html = '';
		for (var i = 0, len = projects.length; i < len; i++) {
			var project = projects[i];
			var preview = getProjectPreview(type, project);
			html += '<li class="loading project ' + project.type + ' preview-' + project.preview_type + '" id="project' + project.id + '" data-id="' + project.id + '">' +
						'<div class="thumb">' +
							'<img src="' + project.thumb + '" style="display:none;" />' +
							'<img class="lazy" data-original="' + project.thumb + '" src="img/grey.gif" />' +
						'</div>' +
						'<a class="border"' + (project.preview_type != 'unknown' ? ' href="#/projects/' + type + '/' + project.id + '"' : '') + '></a>' +
						'<div class="preview">' + preview + '</div>' +
						'<h2 class="title">' + project.title + '<i></i></h2>' +
						'<h3 class="title">' + project.title + '<i></i></h3>' +
						($.trim(project.description) == '' ? '' : '<p>' + project.description + '</p>') +
						($.trim(project.role) == '' ? '' : '<div class="role role-inactive">Role: ' + project.role + '</div>') +
						($.trim(project.role) == '' ? '' : '<div class="role role-active">Role: ' + project.role + '</div>') +
						($.trim(project.url) == '' ? '' : '<a href="' + project.url + '" class="url" target="_blank"></a>') +
					'</li>';
		}
		$('#content').html('<ul class="projects-list type-' + type + '">' + html + '</ul>');
		$('#content .lazy').lazyload({effect : "fadeIn", skip_invisible: false, effect_speed: 0, load: function() {
			var that = this;
			setTimeout(function() {
				$(that).parent().parent().removeClass('loading');
			}, 100);
		}});
		$(window).trigger('scroll');

		Cufon.replace("h2", {fontFamily: 'Univers Black'});
		Cufon.replace("h3, .role");

		return true;
	}

	function getProjectPreview(type, project) {
		var html = '';
		html += '<a class="close control" href="#/projects/' + type + '"></a>';

		if (typeof project.preview.video != 'undefined') {
			html += '<iframe src="' + project.preview.video + '" width="750" height="421" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen class="loading" onload="$(this).removeClass(\'loading\')"></iframe>';
		} else if (typeof project.preview.flash != 'undefined') {
			html += '<p id="flash_container' + project.id + '"><a href="http://www.adobe.com/go/getflashplayer"><img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player" /></a></p>';
		} else if (typeof project.preview.slides != 'undefined') {
			var pics = '';
			for (var i = 0, len = project.preview.slides.length; i < len; i++) {
				pics += '<img src="' + project.preview.slides[i] + '" />';
			}

			if (project.preview.slides.length == 1) {
				html += pics;
			} else {
				html += '<div class="slides slides' + project.id + '">' +
							'<a href="#" title="Previous" class="slidesjs-previous slidesjs-navigation control"><i></i></a>' +
							'<a href="#" title="Next" class="slidesjs-next slidesjs-navigation control"><i></i></a>' +
							pics + '</div>';
			}
		}

		return html;
	}

	function openProject(type, id) {
		var project = getProjectById(type, id);
		if (!project) {
			return;
		}

		var el = $('#project' + id);
		el.removeClass('loading');
		el.addClass('active');

		if (typeof project.preview.flash != 'undefined') {
			swfobject.embedSWF(project.preview.flash, "flash_container" + project.id, "455", "335", "9.0.0", "js/libs/expressInstall.swf", {}, {wmode:"transparent"}, {});
		} else if (typeof project.preview.slides != 'undefined') {
			if (project.preview.slides.length > 1) {
				var $img = $(".slides" + project.id + " img:first");

                var img = new Image();
				img.onload = function() {
                    $(".slides" + project.id).slidesjs({
						width: $img.width(),
						height: $img.height(),
						navigation: {active: false},
						play: {auto: true}
					});
				};
				img.src = $img.get(0).src;
			}
		}
		setTimeout(function() {
			$('html, body').animate({scrollLeft: el.offset().left - parseInt($('.projects-list').css('marginLeft'))}, 500, 'easeOutCubic');
		}, 10);
	}

	function closeOpenedProject() {
		var el = $('.project.active');
		el.removeClass('active');

		var project = getProjectById(el.attr('data-id'));
		if (project) {
			$('.preview', el).html(getProjectPreview(project));
		}
		$(window).trigger('scroll');
	}

	function getProjectById(type, id) {
		var projects = dataManager.getProjects(type);
		for (var i = 0, len = projects.length; i < len; i++) {
			if (projects[i].id == id) {
				return projects[i];
			}
		}
	}

	function drawClients() {
		var clients = dataManager.getClients();
		var html = '';
		for (var i = 0, len = clients.length; i < len; i++) {
			var img_html = '<img src="' + clients[i].thumb + '" title="' + clients[i].name + '" class="loading" onload="$(this).removeClass(\'loading\')" />';

			html += '<li>';
			if ($.trim(clients[i].project_id) != '') {
				html += '<a href="#/projects/all/' + clients[i].project_id + '">' + img_html + '</a>';
			} else {
				html += img_html;
			}
			html += '</li>';
		}
		$('#content').html('<ul class="clients-list">' + html + '</ul>');
	}

	function loadDataSuccess() {
		drawContactInfo();

		Router({
            '/projects/:type/:all': function(type, id) {
                shouldOpenFirstProjectOnLoad = false;
                drawProjects(type);
                closeOpenedProject();
                resize();
                openProject(type, id);
            },
            '/projects/:type': function(type) {
				var rendered = drawProjects(type);
				if (!rendered) {
					closeOpenedProject();
				}
				resize();
				if (shouldOpenFirstProjectOnLoad) {
                    goTo($('#content li:first .border[href]').attr('href'));
					shouldOpenFirstProjectOnLoad = false;
				}
			},
			'/clients': function() {
				shouldOpenFirstProjectOnLoad = false;
				drawClients();
				resize();
			},
            '/projects': function() {
                goTo('/projects/all');
            },
            '': function() {
                goTo('/projects/all');
            }
		}).configure({
			on: function() { updateMenu(window.location.hash);}
		}).init('/');
	}

    function goTo(hash) {
        window.location.hash = hash;
    }

    function drawContactInfo() {
		var info = dataManager.getInfo();

		$('#contactPhone').attr('href', 'callto:' + info.phone).html(info.phone);
		$('#contactEmail').attr('href', 'mailto:' + info.email).html(info.email);
		Cufon.replace("#contactPhone, #contactEmail, #contactSeparator");

        $('#contactInfo').click(function(e) {
			e.preventDefault();
			$(this).parent().toggleClass('active');
		});
	}

	function updateMenu(hash) {
		$('.menu > li').removeClass('active');
        $('.projects-menu > li').removeClass('active');

        var page = hash.split('/')[1];
        var type = hash.split('/')[2];

        if (type) {
            $('a[href=#\\/' + page + '\\/' + type + ']:not(.close)').parent().addClass('active');
        } else {
            $('a[href=#\\/projects\\/' + lastProjectType + ']:not(.close)').parent().addClass('active');
        }

        $('a[href=#\\/' + page + ']:not(.close)').parent().addClass('active');

        lastProjectType = type;
	}

	$(window).scroll(function(){
		$('#header').css('top', -$(this).scrollTop());
	});

	function resize() {
		var w = $('body').width();
		var h = $('body').height();
		var header_top = Math.max(0, (h - 775) / 2);

		$('#header').css('padding-top', header_top + 'px');
		$('#content').css('padding-top', (header_top + 113) + 'px');

		var header_left = 49 + Math.min(Math.max(0, Math.round((w - 1280) / 4.67)), 137);
		var projects_left = 111 + Math.min(Math.max(0, Math.round((w - 1280) / 4.08)), 157);
		var clients_left = 50 + Math.min(Math.max(0, Math.round((w - 1280) / 4.35)), 147);
		$('#header').css('padding-left', header_left + 'px');
		$('.projects-list').css('margin-left', projects_left + 'px').css('margin-right', projects_left + 'px');
		$('.clients-list').css('margin-left', clients_left + 'px');
	}

	$(window).resize(resize);
	resize();

	return {
		init: init
	};
})();


var DataManager = function(callback) {
	this.success = callback;
	this.document = null;
};

DataManager.prototype.load = function() {
	var that = this;
	$.get(XML_FILE, function(data) {
		that.document = $(data).find('data');
		that.success();
	}, 'xml');
};

DataManager.prototype.getProjects = function(section) {
	var items = [];
	$('project', this.document).each(function(index) {
		var project = $(this);
        if (section != 'all' && project.find('section').text() != section) {
            return;
        }
		var preview = project.find('preview');

		var item = {
			id: project.find('id').text() || index,
			type: project.find('type').text(),
			preview_type: preview.find(':first').get(0) ? preview.find(':first').get(0).tagName : 'unknown',
			url: project.find('url').text(),
			title: project.find('name').text(),
			description: project.find('description').text(),
			role: project.find('role').text(),
			thumb: project.find('thumb').text(),
			preview: {}
		};

		switch (item.preview_type) {
			case 'video':
				item.preview.video = preview.text();
				break;
			case 'flash':
				item.preview.flash = preview.text();
				break;
			case 'pic':
				var slides = [];
				var pics = preview.find('pic');
				for (var j = 0, len = pics.length; j < len; j++) {
					slides[slides.length] = $(pics[j]).text();
				}
				item.preview.slides = slides;
				break;
			default:
				break;
		}

		items[items.length] = item;
	});
	return items;
};

DataManager.prototype.getClients = function() {
	var res = [];
	$('client', this.document).each(function() {
		var client = $(this);

		res[res.length] = {
			name: client.find('name').text(),
			thumb: client.find('thumb').text(),
			project_id: client.find('project_id').text()
		};
	});
	return res;
};

DataManager.prototype.getInfo = function() {
	var info = this.document.find('info');
	return {
		phone: info.find('phone').text(),
		email: info.find('email').text()
	};
};
