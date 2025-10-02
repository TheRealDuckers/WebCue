<h1>WebCue Lab v3.1</h1>
<h3>A web version of QLab.</h3>
<h4>Your welcome.</h4>
 <em>NOTE: Some back-end parts of this service where partly coded by AI - this is a new concept to me and I needed help :-)</em>
<h2>📄 Docs</h2>
<h3>Go to the <a href="https://therealduckers.github.io/WebCue">website</a></h3>
<p>You will be asked what broswer you are on - this is because some browsers don't support certain features of WebCue, and using the wrong version may casue errors. If it doesn't detect your browser correctly, press "no" and select your browser manually. If you are on Opera, select Chrome as your browser. If you are on a Chronuim-based browser, then select Chrome as your browser. If you are not sure, select Other.</p>

<h2>Upload your files</h2>
<p><b>If you are on Chrome, Edge, Opera or any Chronium Based browser,</b> you are in luck! Select "Choose Directory" and select the folder which your audio cues are in. You only have to select this folder when you want to re-load a show. Press "Save Show" to save and "Load Show" to load. When loading, press "Load Show" and then re-select the directory. All files will be auto-matched to the cue from the saved show.</p>

<p><b>If you are on any other browser (Firefox, etc.), </b> you will have to re-upload all files (not a folder) when re-loading. Auto match will re-match your cues and audio automatically - even if you changed name, number etc.</p>
<h2>🎚️ Features</h2>
<h4>Cue advance options</h4>
<p>Setting a cue to Manual in the Follow field will require a user to press "GO" before the cue plays.</p>
<p>Setting a cue to Auto in the Follow field will automatically play the cue once the one before it has finsihed.</p>
<P>(see these options by using the dropdown in the Follow field.</P>

<h4>Lighting Cues (QLC+)</h4>
<p>To use lighting cues:</p>
<p>Start QLC+ with the -w or --web option</p>
<p>Create a function</p>
<p>Then, create a script, (still in functions tab) and press the Add symbol in the side pane, and press Start Function (you can also create cues to Stop Functions, chnage fixtures, etc.)</p>
<p>You will get an output like startfunction:1 // New Scene 1, take the last number (in this case 1) and enter that into the lighting cue box in WebCue</p>
<p>Now, whenever you trigger that cue, that lighting cue will be sent to QLC+!</p>

<h4>BETA mode (for the ones who are feeling spicy)</h4>
<p>Simply add /BETA onto any url within webcue (jokes - only on the main page)</p>
<p>Current BETA features: Left/Right arrow is GO/Fade and swipe left/right is also GO/Fade</p>
<p> Also, <a href="https://therealduckers.github.io/WebCue/tune">here</a> is a cool little tool AI made. It shows bass, treble, pan, graphs etc. #nerdy! However, it currently doesn't work when you play music to test audio quality, so hold on whilst I fix that.</p>


<p>Made with ❤️ by Duckers</p>
