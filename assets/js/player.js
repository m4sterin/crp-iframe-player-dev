window.addEventListener("message", function (e) {
	//console.log(e.currentTarget.document.referrer);

	var video_config_media = JSON.parse(e.data.video_config_media);
	console.log(video_config_media)
	var user_lang = e.data.lang;
	var video_stream_url = "";
	var video_id = video_config_media['metadata']['id'];
	var rows_number = 0;
	var video_m3u8_array = [];
	var video_m3u8 = "";
	var episode_title = "";
	var episode_translate = "";
	var series_title = "";
	var series_url = e.currentTarget.document.referrer;
	var is_ep_premium_only = null;
	var video_dash_playlist_url_only_trailer = "";
	var video_dash_playlist_url_old = "";
	var video_dash_playlist_url = "";

	console.log(e)
	console.log(series_url);
	if (user_lang == "enUS")
		var series_rss = "https://www.crunchyroll.com/" + series_url.split("/")[3] + ".rss";
	else
		var series_rss = "https://www.crunchyroll.com/" + series_url.split("/")[4] + ".rss";

	//console.log(video_config_media);

	for (var i = 0; i < video_config_media['streams'].length; i++) {
		if (video_config_media['streams'][i].format == 'trailer_hls' && video_config_media['streams'][i].hardsub_lang == user_lang)
			if (rows_number <= 4) {
				video_m3u8_array.push(video_config_media['streams'][i].url.replace("clipTo/120000/", "clipTo/" + video_config_media['metadata']['duration'] + "/").replace(video_config_media['streams'][i].url.split("/")[2], "dl.v.vrv.co"));
				rows_number++;
			}
		if (video_config_media['streams'][i].format == 'adaptive_hls' && video_config_media['streams'][i].hardsub_lang == user_lang) {
			video_stream_url = video_config_media['streams'][i].url.replace("pl.crunchyroll.com", "dl.v.vrv.co");
			break;
		}
	}
	
	function cat(url){
		$.ajax({
			async: true,
			type: "GET",
			url: url,
			success: (a, b, xhr) => {
				console.log(url, xhr);
			}
		});
	}
	for (i in video_m3u8_array)
		cat(video_m3u8_array[i]);

	video_m3u8 = '#EXTM3U' +
		'\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=4112345,RESOLUTION=1280x720,FRAME-RATE=23.974,CODECS="avc1.640028,mp4a.40.2"' +
		'\n' + video_m3u8_array[0] +
		'\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=8098235,RESOLUTION=1920x1080,FRAME-RATE=23.974,CODECS="avc1.640028,mp4a.40.2"' +
		'\n' + video_m3u8_array[1] +
		'\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2087088,RESOLUTION=848x480,FRAME-RATE=23.974,CODECS="avc1.4d401f,mp4a.40.2"' +
		'\n' + video_m3u8_array[2] +
		'\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1090461,RESOLUTION=640x360,FRAME-RATE=23.974,CODECS="avc1.4d401e,mp4a.40.2"' +
		'\n' + video_m3u8_array[3] +
		'\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=559942,RESOLUTION=428x240,FRAME-RATE=23.974,CODECS="avc1.42c015,mp4a.40.2"' +
		'\n' + video_m3u8_array[4];

	console.log(video_m3u8)
	if (video_stream_url == "") {
		var blob = new Blob([video_m3u8], {
			type: "text/plain; charset=utf-8"
		});
		video_stream_url = URL.createObjectURL(blob) + "#.m3u8";
	}

	//Pega varias informações pela pagina rss.
	console.log('series_rss', series_rss);
	let crproxy = 'https://crp-proxy.herokuapp.com/';
	$.ajax({
		async: true,
		type: "GET",
		url: crproxy + series_rss,
		contentType: "text/xml; charset=utf-8",
		complete: function (response) {

			//Pega o titulo da serie
			series_title = $(response.responseXML).find("image").find("title").text();

			//Pega o numero e titulo do episodio
			switch (user_lang[0]) {
				case ("ptBR"):
					episode_translate = "Episódio ";
					break;
				case ("enUS"):
					episode_translate = "Episode ";
					break;
				case ("enGB"):
					episode_translate = "Episode ";
					break;
				case ("esLA"):
					episode_translate = "Episodio ";
					break;
				case ("esES"):
					episode_translate = "Episodio ";
					break;
				case ("ptPT"):
					episode_translate = "Episódio ";
					break;
				case ("frFR"):
					episode_translate = "Épisode ";
					break;
				case ("deDE"):
					episode_translate = "Folge ";
					break;
				case ("arME"):
					episode_translate = "الحلقة ";
					break;
				case ("itIT"):
					episode_translate = "Episodio ";
					break;
				case ("ruRU"):
					episode_translate = "Серия ";
					break;
				default:
					episode_translate = "Episode ";
			}

			if (video_config_media['metadata']['up_next'] == undefined) {
				episode_title = series_title + ' - ' + episode_translate + video_config_media['metadata']['display_episode_number'];
			} else {
				var prox_ep_number = video_config_media['metadata']['up_next']['display_episode_number'];
				episode_title = video_config_media['metadata']['up_next']['series_title'] + ' - ' + prox_ep_number.replace(/\d+/g, '') + video_config_media['metadata']['display_episode_number'];
			}

			//Inicia o player
			var playerInstance = jwplayer("player_div")
			playerInstance.setup({
				"title": episode_title,
				"description": video_config_media['metadata']['title'],
				"file": video_stream_url,
				"image": video_config_media['thumbnail']['url'],
				"width": "100%",
				"height": "100%",
				"autostart": false,
				"displayPlaybackLabel": true,
				"primary": "html5"
			});

			//Variaveis para o botao de baixar.
			var button_iconPath = "assets/icon/download_icon.svg";
			var button_tooltipText = "Baixar Vídeo";
			var buttonId = "download-video-button";

			//function que pega algo dentro dentro do html.
			function pegaString(str, first_character, last_character) {
				if (str.match(first_character + "(.*)" + last_character) == null) {
					return null;
				} else {
					new_str = str.match(first_character + "(.*)" + last_character)[1].trim()
					return (new_str)
				}
			}

			//function que decodifica caracteres html de uma string
			function htmlDecode(input) {
				var e = document.createElement('textarea');
				e.innerHTML = input;
				// handle case of empty input
				return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
			}

			//function que pega o tamanho de um arquivo pela url
			function setFileSize(url, element_id, needs_proxy) {
				var fileSize = "";
				var http = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));

				if (needs_proxy == true) {
					final_url = crproxy + url;
				} else {
					final_url = url;
				}

				http.onreadystatechange = function () {
					if (http.readyState == 4 && http.status == 200) {
						//Pega o tamanho em bytes do arquivo de video
						fileSize = http.getResponseHeader('content-length');

						//Se o fileSize for igual a null é porque precisa de proxy pra pegar o header
						if (!fileSize && !needs_proxy) {
							setFileSize(url, element_id, true);
						} else {
							var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
							if (fileSize == 0) return 'n/a';
							var i = parseInt(Math.floor(Math.log(fileSize) / Math.log(1024)));
							if (i == 0) return fileSize + ' ' + sizes[i];

							var return_fileSize = (fileSize / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
							document.getElementById(element_id).innerText = return_fileSize;
						}
					}
				}
				http.open("HEAD", final_url, true);
				http.send(null);
			}

			//funcion ao clicar no botao de fechar o menu de download
			document.querySelectorAll("button.close-modal")[0].onclick = function () {
				document.querySelectorAll(".modal")[0].style.visibility = "hidden";
			};

			//function ao clicar no botao de baixar
			function download_ButtonClickAction() {
				//Se estiver no mobile, muda um pouco o design do menu
				if (jwplayer().getEnvironment().OS.mobile == true) {
					document.querySelectorAll(".modal")[0].style.height = "170px";
					document.querySelectorAll(".modal")[0].style.overflow = "auto";
				}

				//Mostra o menu de download
				document.querySelectorAll(".modal")[0].style.visibility = "visible";

				//Pega a url da playlist atual
				player_current_playlist = jwplayer().getPlaylist()[0].file;

				//console.log("Playlist Atual:" + player_current_playlist);

				//Verifica se o ep é so pra usuarios premium
				if (player_current_playlist.indexOf('blob:') !== -1) {
					is_ep_premium_only = true;
				} else {
					is_ep_premium_only = false;
				}

				//console.log("is_ep_premium_only: " + is_ep_premium_only);
				const r = { 0: '720p', 1: '1080p', 2: '480p', 3: '360p', 4: '240p' }

				//Se o episodio não for apenas para premium pega as urls de um jeito mais facil
				if (is_ep_premium_only == false) {
					video_dash_playlist_url_old = player_current_playlist.replace("master.m3u8", "manifest.mpd").replace(player_current_playlist.split("/")[2], "dl.v.vrv.co").replace("evs1", "evs");
					video_dash_playlist_url = player_current_playlist.replace(player_current_playlist.split("/")[2], "v.vrv.co").replace("evs1", "evs");

					$.ajax({
						async: true,
						type: "GET",
						url: video_dash_playlist_url_old,
						success: (result, status, xhr) => {
							var params_download_link = htmlDecode(pegaString(xhr.responseText, '.m4s?', '"'));

							function linkDownload(id) {
								var video_code = video_dash_playlist_url.split(",")[id];
								var video_mp4_url = video_dash_playlist_url.split("_,")[0] + "_" + video_code + params_download_link;
								document.getElementById(r[id]+"_down_url").href = video_mp4_url;
								setFileSize(video_mp4_url, r[id]+"_down_size");
							}

							for (id in r)
								linkDownload(id);
						}
					});
				}

				//Se o episodio for apenas para usuarios premium
				if (is_ep_premium_only == true) {
					function linkDownload(id) {
						var video_dash_playlist_url_no_clipe = video_m3u8_array[id].replace("/clipFrom/0000/clipTo/" + video_config_media['metadata']['duration'] + "/index.m3u8", ",.urlset/manifest.mpd");
						var video_dash_playlist_url = video_dash_playlist_url_no_clipe.replace(video_dash_playlist_url_no_clipe.split("_")[0] + "_", video_dash_playlist_url_no_clipe.split("_")[0] + "_,");
						function cb(result, status, xhr) {
							var params_download_link = htmlDecode(pegaString(xhr.responseText, '.m4s?', '"'));
							if (!params_download_link)
								return linkDownload(id);
							var video_mp4_url_old = video_dash_playlist_url.split("_,")[0] + "_" + video_dash_playlist_url.split(",")[1] + params_download_link;
							var video_mp4_url = video_mp4_url_old.replace("dl.v.vrv.co", "v.vrv.co");
							document.getElementById(r[id]+"_down_url").href = video_mp4_url;
							setFileSize(video_mp4_url, r[id]+"_down_size");
						};

						$.ajax({
							async: true,
							type: "GET",
							url: video_dash_playlist_url,
							success: cb
						});
					}

					for (id in r)
						linkDownload(id);
				}
			}

			playerInstance.addButton(button_iconPath, button_tooltipText, download_ButtonClickAction, buttonId);

			//Funções para o player
			jwplayer().on('ready', e => {
				//Seta o tempo do video pro salvo no localStorage		
				if (localStorage.getItem(video_id) != null) {
					document.getElementsByTagName("video")[0].currentTime = localStorage.getItem(video_id);
				}
				document.body.querySelector(".loading_container").style.display = "none";

				//Fica salvando o tempo do video a cada 5 segundos.
				setInterval(() => {
					if (jwplayer().getState() == "playing")
						localStorage.setItem(video_id, jwplayer().getPosition());
				}, 5000);
			});
			//Mostra uma tela de erro caso a legenda pedida não exista.
			jwplayer().on('error', e => {
				console.log(e)
				if (e.code == 232011) {
					jwplayer().load({
						file: "https://i.imgur.com/OufoM33.mp4"
					});
					jwplayer().setControls(false);
					jwplayer().setConfig({
						repeat: true
					});
					jwplayer().play();
				}
			});
		}
	});
});
