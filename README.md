<h1>WebCue Lab v3.1</h1>
<h3>A web version of QLab.</h3>
<h4>Your welcome.</h4>
<p>Go, Stop All, Fade</p>
<p>Bulk upload cues</p>

<h2>Setting Up a Show</h2>
<p> 1. Go to <a href="https://therealduckers.github.io/WebCue">therealduckers.github.io/WebCue</a></p>
<p> 2. Select "Choose Files" (<em>Note: Make sure your files upload in the order you want them to appear in WebCue</em>) </p>
<p> 3. Once your files have uploaded, they will appear in the WebCue interface. You can now change names, add notes, and set lighting cues</p>
<p> 4. To save, press "Save Show" and enter a name</p>
<p> 5. To load a show, press "Load Show" then select the show you want from the dropdown menu</p>

<h2>Features</h2>
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
