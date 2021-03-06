InputModule = require "input-framer/input"
CameraInput = require "framer-camera-input/CameraInput"
FontAwesome = require 'FontAwesome'

#General
#variables
padding = 12
HeaderHeight = 64
height = 32

#data
galleryData = JSON.parse Utils.domLoadDataSync "data/galleryData.json"
tagsData = JSON.parse Utils.domLoadDataSync "data/Bucketdata2.json"
iconsData = JSON.parse Utils.domLoadDataSync "data/icons.json"
horizontalTagsData = JSON.parse Utils.domLoadDataSync "data/horizontalTagsData.json"


#Header Class
class Header extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width
		@options.height = HeaderHeight
		@options.backgroundColor ?= "#FAF7F7"
		@options.y = Align.top()
		@options.shadowY ?= 1
		@options.shadowColor ?= "rgba(0,0,0,0.2)"
		@options.shadowBlur = 3
		@options.z = 1
		
		@Back = new Layer
		@BackImage = new Layer
		@CloseImage = new Layer
		#@backk = new TextLayer
		@ScreenName = new TextLayer
		@ExtraFeature = new Layer
		@NextImage = new Layer
		#@next = new TextLayer
		super @options
		
		@Back.parent = @
		@Back.width = @options.height/1.2
		@Back.height = @options.height
		@Back.backgroundColor = "null"
		#@Back.image = "Images/Icons/ActionsIcons/01.png"
		
		@CloseImage.parent = @
		@CloseImage.width = @options.height/3
		@CloseImage.height = @options.height/3
		@CloseImage.backgroundColor ?= "#ddd"
		@CloseImage.x = Align.left(1.5 * padding)
		@CloseImage.y = Align.center()
		@CloseImage.image = "images/Icons/ActionIcons/03.png"
		@CloseImage.opacity = 0
		
		@BackImage.parent = @
		@BackImage.width = @options.height/3
		@BackImage.height = @options.height/3
		@BackImage.backgroundColor ?= "#ddd"
		@BackImage.x = Align.left(1.5 * padding)
		@BackImage.y = Align.center()
		@BackImage.image = "images/Icons/ActionIcons/02.png"
		
		
		@ScreenName.parent = @
		@ScreenName.fontSize = 20
		@ScreenName.y = Align.center
		@ScreenName.x = @Back.width + padding
		
		@ExtraFeature.parent = @
		@ExtraFeature.width = @options.height
		@ExtraFeature.height = @options.height
		@ExtraFeature.x = Align.right()
		@ExtraFeature.backgroundColor = "null"
		#@ExtraFeature.image = "Images/Icons/ActionIcons/01.png"
		
		@NextImage.parent = @
		@NextImage.width = @options.height/3
		@NextImage.height = @options.height/3
		@NextImage.x = Align.right(-1.5 * padding)
		@NextImage.y = Align.center()
		@NextImage.image = "images/Icons/ActionIcons/01.png"
		###
		@next.parent = @ExtraFeature
		@next.fontSize = 16
		@next.x = Align.left(padding)
		@next.y = Align.center()
		@next.text = "Next"
		@next.color = "#eee"

		@backk.parent = @Back
		@backk.fontSize = 12
		@backk.x = Align.left(padding)
		@backk.y = Align.center()
		@backk.text = "Back"
		@backk.color = "#333"
		###

#Profile Class
class profileHead extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width
		@options.height = 64 * 2
		@options.backgroundColor = "#fff"
		
		@ProfilePic = new Layer
		@ProfileName = new TextLayer
		@ProfileBio = new TextLayer
		@ProfileTag = new TextLayer
		@ppTag = new TextLayer
		super @options
		
		@ProfilePic.parent = @
		@ProfilePic.height = @options.height/2 - (2 * padding)
		@ProfilePic.width = @options.height/2 - (2 * padding)
		@ProfilePic.x = padding
		@ProfilePic.y = padding
		@ProfilePic.borderRadius = @.height/2
		@ProfilePic.image = "Images/All/07.jpg"
		
		@ProfileName.parent = @
		@ProfileName.fontSize = 16
		@ProfileName.fontWeight = 600
		@ProfileName.x = @ProfilePic.width + 2*padding
		@ProfileName.y = Align.top(padding)
		
		@ProfileBio.parent = @
		@ProfileBio.fontSize = 12
		@ProfileBio.x = @ProfilePic.width + 2*padding
		@ProfileBio.y = Align.top(@ProfileName.height + padding)
		
		@ProfileTag.parent = @
		@ProfileTag.padding = padding
		@ProfileTag.fontSize = 14
		@ProfileTag.color = "#333"
		@ProfileTag.borderRadius = 6
		@ProfileTag.borderColor = "#aaa"
		@ProfileTag.borderWidth = 2
		@ProfileTag.width ?= 200
		@ProfileTag.x = 2* padding
		@ProfileTag.y = Align.top(@ProfileBio.height + @ProfileBio.y + 2* padding)
	
		@ProfileTag.states = 
			select:
				text: "Select Tag"
				backgroundColor: "#ddd"
			selecting:
				text: "Selecting"
				backgroundColor: "#000000"
		
		@ppTag.parent = @
		@ppTag.padding = padding
		@ppTag.backgroundColor = "#ddd"
		@ppTag.fontSize = 14
		@ppTag.color = "#777"
		@ppTag.borderRadius = 6
		@ppTag.width ?= 200
		@ppTag.x = 2* padding + @ProfileTag.width
		@ppTag.text = "@TagAPerson"
		@ppTag.y = Align.top(@ProfileBio.height + @ProfileBio.y + 2* padding)

#tag Select Claases

class tag extends TextLayer
	constructor: (@options={}) ->
		@options.padding = padding
		@options.backgroundColor ?= "#ddd"
		@options.fontSize = 20
		@options.color = "#333"
		@options.borderRadius = 6
		@options.width ?= 200
		#@options.height = (@options.fontSize * @options.lineHeight) * 4
		super @options

class bucket extends Layer
	constructor: (@options={}) ->
		@options.opacity ?= 0.5
		@options.originX ?= 0.5
		@options.originY ?= 0.5
		@options.width ?= bucketsBG.width - 4*padding
		@options.height ?= bucketsBG.width - 4*padding
		@options.borderRadius = 8
		@bucketImage = new Layer
			height: @options.height/2
			width: @options.width/2
			borderRadius: 4
		super @options
		
		@bucketImage.parent = @
		@bucketImage.borderRadius = 0
		@bucketImage.style = backgroundSize: "Contain"
		#@bucketImage.backgroundColor = "#fff"
		@bucketImage.scale = 1.2
		@bucketImage.x = Align.center()
		@bucketImage.y = Align.center()

#Explore Classes
class ExploreBucketThumb extends Layer
	constructor: (@options={}) ->
		@options.width ?= thumbSize*.7
		@options.height ?= thumbSize
		@options.backgroundColor ?= "rgba(255,255,255,0)"
		
			
		@label = new TextLayer
			fontSize: 16

			
		@thumb = new Layer
					
		super @options
		
		@label.parent = @
		@label.centerX()
		@label.textAlign = "center"
		@label.state = "default"
		@label.width = @options.width
		@label.autoHeight = yes
		@label.y = thumbSize*0.75
		@label.centerX()
		@label.color = "rgba(255,255,255,1)"
		@label.fontStyle = "bold"
		@label.opacity = 0.7
		
		@thumb.parent = @
		@thumb.width = thumbSize*0.7
		@thumb.height = thumbSize*0.7
		@thumb.centerX()
		@thumb.state = "default"
		@thumb.style = backgroundSize: "contain"
		
		@thumb.states = 
			active:
				opacity:1
				scale: 1
			default:
				opacity: 0.5
				scale: 0.8
		
		@label.states = 
			active:
				fontWeight: 600
				opacity: 1
			default:
				fontWeight: 400
				opacity: 0.4
				
		@onClick ->
			if @.thumb.state == "default"
				@.thumb.states.switchInstant "active"
				@.thumb.state = "active"
				@.label.states.switchInstant "active"
				@.label.state = "active"
				newActiveExploreBucket = (item for item in ExploreBucketBoxes when item.thumb == @)[0]
				newActiveExploreBucket.states.switchInstant "active"
				newActiveExploreBucket.state = "active"
				newActiveExploreBucket.visible = true
				activeExploreBucket = newActiveExploreBucket
				newExploreBucketIndex = ExploreBucketBoxes.indexOf(newActiveExploreBucket)
				centerExploreBucket = if newExploreBucketIndex > 1 then ExploreBucketBoxes[newExploreBucketIndex-1] 								else newActiveExploreBucket
				ExploreBucketThumbnailsContainer.scrollToLayer(centerExploreBucket.thumb)
				ExploreBucketThumbnailsContainer.states.active =
					x: padding
					parent: newActiveExploreBucket
					visible: true
					backgroundColor: newActiveExploreBucket.backgroundColor
				ExploreBucketThumbnailsContainer.states.switchInstant "active"
				ExploreBucketThumbnailsContainer.state = "active"
				back.visible = true
				back.parent = newActiveExploreBucket
				activeIndex = ExploreBucketBoxes.indexOf(newActiveExploreBucket)
				for inActiveExploreBucketBox, index in ExploreBucketBoxes
					if index != activeIndex
						inActiveExploreBucketBox.visible = false
						inActiveExploreBucketBox.thumb.thumb.states.switchInstant "default"
						inActiveExploreBucketBox.thumb.thumb.state = "default"
						inActiveExploreBucketBox.thumb.label.states.switchInstant "default"
						inActiveExploreBucketBox.thumb.label.state = "default"
				for tagLayer in exploreTagsContainer.content.children
					tagLayer.destroy()
				exploreTagsContainer.visible = false		
				for tagObject, index in newActiveExploreBucket.tags
					tagLayer = comp_tag.copy()
					tagLayer.parent = exploreTagsContainer.content
					tagLayer.originX = 0
					tagLayer.scale = 1.4
					tagLayer.x = exploreTagsContainer.frame.x
					tagLayer.y = index*(tagLayer.height + padding)
					tag_name.text = tagObject.name
					roundOff = Math.round(tagObject.noOfShares/10000)
					if roundOff > 100 
						roundOff = Math.round(roundOff/100)
					tag_trend.text = roundOff
				exploreTagsContainer.visible = true
				
		
class ExploreBucket extends Layer
	constructor: (@options={}) ->
		@options.width ?= boxSize
		@options.height ?= boxSize
		@options.borderRadius ?= "16px"
		
		@label = new TextLayer
			fontSize: 16
			color: "rgba(255,255,255,1)"
		@thumbnail = new Layer
			width: @options.width*0.6
			height: @options.height*0.6
# 			borderRadius:  @options.height*0.3
		
		super @options
				
		@thumbnail.parent = @
		@thumbnail.centerX()
		@thumbnail.y = 16
		@thumbnail.state = "default"
		@thumbnail.style = backgroundSize: "contain"
		@label.parent = @
		@label.textAlign = "center"
		@label.state = "default"
		@label.width = @options.width
		@label.centerX()
		@label.height = 16
		@label.y = @thumbnail.y + @thumbnail.height + 16
		
		@states =
			default:
				height: @options.height
				width: @options.width
				x: @options.x
				y: @options.y
				borderRadius: "16px"
			active:	
				height: ExploreBucketThumbnailsContainerHeight + 2*padding
				width: Screen.width
				x: 0
				y: 0
				borderRadius: "0px"
				animationOptions: 
					curve: Bezier.easeOut
					time: 0.1	
# 		@label.states =
# 			default:
# 				x: @thumbnail.x
# 				y: @thumbnail.y + @thumbnail.height + 16
# 				textAlign: "center"
# 				width: @options.width
# 				autoHeight: yes
# 				animationOptions: 
# 					curve: Bezier.linear
# 					time: 0.1	
# 			active:
# 				x: @thumbnail.x + @thumbnail.width + padding
# 				y: @thumbnail.y + @thumbnail.height*0.8
# 				textAlign: "center"
# 				width: @options.width
# 				autoHeight: yes
# 				animationOptions: 
# 					curve: Bezier.linear
# 					time: 0.1		
				
		@thumbnail.states =
			default:
				x: @options.width*0.2
				y: 16
				width: @options.width*0.6
				height: @options.height*0.6
# 				borderRadius:  @options.height*0.3
				animationOptions: 
					curve: Bezier.easeIn
					time: 0.1	
			active:
# 				x: @options.width*0.2
# 				y: 16 + ExploreBucketThumbnailsContainerHeight + 0.4*padding
# 				textAlign: "center"
				width: 0
				height: 0
# 				autoHeight: yes
				animationOptions: 
					curve: Bezier.easeOut
					time: 0.1		
		
		@.onClick ->
			if @.state != "active"
				search.visible = false
				back.visible = true
				scroll.scrollToTop()
				scroll.scrollHorizontal = false
				scroll.scrollVertical = false
				@.states.switchInstant "active"
				@.state = "active"
				ExploreBucketThumbnailsContainer.states.active =
					parent: @
					visible: true
					backgroundColor: @.backgroundColor
					x: padding
				ExploreBucketThumbnailsContainer.states.switchInstant "active"
				ExploreBucketThumbnailsContainer.state = "active"
				ExploreBucketThumbnailsContainer.scrollToLayer(@.thumb)
				back.visible = true
				back.parent = @
				@.thumb.thumb.states.switchInstant "active"
				@.thumb.thumb.state = "active"
				@.thumb.label.states.switchInstant "active"
				@.thumb.label.state = "active"
				activeExploreBucket = @
				activeIndex = ExploreBucketBoxes.indexOf(@)
				for inActiveExploreBucketBox, index in ExploreBucketBoxes
# 					inActiveExploreBucketBox.label.states.switchInstant "active"
# 					inActiveExploreBucketBox.label.state = "active"
					inActiveExploreBucketBox.thumbnail.states.switchInstant "active"
					inActiveExploreBucketBox.thumbnail.state = "active"
					
					if index != activeIndex
						inActiveExploreBucketBox.visible = false
						inActiveExploreBucketBox.thumb.thumb.states.switchInstant "default"
						inActiveExploreBucketBox.thumb.thumb.state = "default"
						inActiveExploreBucketBox.thumb.label.states.switchInstant "default"
						inActiveExploreBucketBox.thumb.label.state = "default"
					else
						inActiveExploreBucketBox.thumb.thumb.states.switchInstant "active"
						inActiveExploreBucketBox.thumb.thumb.state = "active"
						inActiveExploreBucketBox.thumb.label.states.switchInstant "active"
						inActiveExploreBucketBox.thumb.label.state = "active"
						
						
				for tagLayer in exploreTagsContainer.content.children
					tagLayer.destroy()
				exploreTagsContainer.visible = false		
				for tagObject, index in @.tags
					tagLayer = comp_tag.copy()
					tagLayer.parent = exploreTagsContainer.content
					tagLayer.originX = 0
					tagLayer.scale = 1.4
					tagLayer.x = exploreTagsContainer.frame.x
					tagLayer.y = index*(tagLayer.height + padding)
					tag_name.text = tagObject.name
					roundOff = Math.round(tagObject.noOfShares/10000)
					if roundOff > 100 
						roundOff = Math.round(roundOff/100)
					tag_trend.text = roundOff
				exploreTagsContainer.visible = true



ExploreBucketBoxes = []

gutter = 20
padding = 16
count = horizontalTagsData.buckets.length
boxSize = (Screen.width-3*padding)/2
thumbSize = ((Screen.width-3.5*padding-back.width)/3)*1.3
focusedBoxHeight = 124	
ExploreBucketThumbnailsContainerHeight = thumbSize + 2*padding
activeExploreBucket = null

ExploreBucketsCont = new Layer
	width: Screen.width
	height: (count/2)*(boxSize+padding) + padding
	backgroundColor: "#ffffff"
	parent : explore
	
scroll = ScrollComponent.wrap(ExploreBucketsCont)
scroll.parent = explore
scroll.scrollHorizontal = false
scroll.content.clip = false
scroll.directionLock = true
scroll.backgroundColor = "rgba(255,255,255,0)"
scroll.mouseWheelEnabled = true
scroll.contentInset =
		bottom: 6*padding + 164

search.parent = scroll.content
search.x = Align.center

exploreTagsContainer = new ScrollComponent
	width: Screen.width
	height: Screen.height - 2*padding
	x: Align.center
	y: 3*padding + ExploreBucketThumbnailsContainerHeight
	backgroundColor: "#fffff"
exploreTagsContainer.parent = ExploreBucketsCont
exploreTagsContainer.scrollHorizontal = false
exploreTagsContainer.backgroundColor = "#fffff"
exploreTagsContainer.mouseWheelEnabled = true
exploreTagsContainer.visible = false
exploreTagsContainer.content.clip = false
exploreTagsContainer.directionLock = true
exploreTagsContainer.centerX()
exploreTagsContainer.contentInset = 
		right: 2*padding
		left: 2*padding
		top: 0.4*padding
		bottom: padding

exploreTagsContainer.onClick ->
	flow.showNext(tag_feed)

dropdown.onClick ->
	flow.showOverlayTop(tag_feed_dropdown)

dismiss.onClick ->
	flow.showPrevious()
	
dismiss_bucket.onClick ->
	flow.showPrevious()

dismiss_tagFeed.onClick ->
	flow.showPrevious()
	
ExploreBucketThumbnailsContainer = new ScrollComponent
	width: Screen.width
	height: ExploreBucketThumbnailsContainerHeight + padding
	x: back.x + back.width + padding
ExploreBucketThumbnailsContainer.parent = ExploreBucketsCont
ExploreBucketThumbnailsContainer.scrollHorizontal = true
ExploreBucketThumbnailsContainer.scrollVertical = false
ExploreBucketThumbnailsContainer.visible = false
ExploreBucketThumbnailsContainer.mouseWheelEnabled = true
ExploreBucketThumbnailsContainer.content.clip = false
ExploreBucketThumbnailsContainer.directionLock = true
ExploreBucketThumbnailsContainer.state = "default"
ExploreBucketThumbnailsContainer.contentInset = 
		right: padding
		left: 0
		top: 3.6*padding
		bottom: 0.4*padding		

ExploreBucketThumbnailsContainer.states =
	default:
		x: padding
		parent: ExploreBucketsCont
		scrollVertical: false
		visible: false
		
back.visible = false
back.parent = ExploreBucketsCont
back.scale = 1.2
back.y = 0.6*padding
back.x = 1.6*padding
	
back.onTap ->
	back.visible = false
	search.visible = true
	ExploreBucketThumbnailsContainer.states.switchInstant "default"
	ExploreBucketThumbnailsContainer.state = "default"
	for ExploreBucketBox in ExploreBucketBoxes
		ExploreBucketBox.visible = true
		ExploreBucketBox.states.switch "default"
		ExploreBucketBox.state = "default"
# 		ExploreBucketBox.label.states.switchInstant "default"
# 		ExploreBucketBox.label.state = "default"
		ExploreBucketBox.thumbnail.states.switchInstant "default"
		ExploreBucketBox.thumbnail.state = "default"
		ExploreBucketBox.thumb.thumb.states.switchInstant "default"
		ExploreBucketBox.thumb.thumb.state = "default"
		ExploreBucketBox.thumb.label.states.switchInstant "default"
		ExploreBucketBox.thumb.label.state = "default"
	scroll.scrollHorizontal = false
	scroll.scrollVertical = true
	ExploreBucketsCont.width = Screen.width
	for tagLayer in exploreTagsContainer.content.subLayers
		tagLayer.destroy()
	exploreTagsContainer.visible = false

	
for ExploreBucketObject, index in horizontalTagsData.buckets
	ExploreBucketBox = new ExploreBucket
	ExploreBucketBox.parent = ExploreBucketsCont
	ExploreBucketBox.width = boxSize
	ExploreBucketBox.height = boxSize	
	xPosition = if (index%2 != 0 and index !=0) then ExploreBucketBox.width + 2*padding 				else padding
	ExploreBucketBox.x = xPosition
	yPosition = search.y + padding + 2*padding + (Math.floor(index/2)) *(ExploreBucketBox.width+padding)
	
	ExploreBucketBox.y = yPosition 
	ExploreBucketBox.states.default =
				height: boxSize
				width: boxSize
				x: xPosition
				y: yPosition
				animationOptions: 
					curve: Bezier.ease
					time: 0.1
	ExploreBucketBox.state = "default"			
	ExploreBucketBox.backgroundColor = ExploreBucketObject.backgroundColor	
	ExploreBucketBox.label.text = ExploreBucketObject.name
	ExploreBucketBox.thumbnail.image = ExploreBucketObject.image
	
	ExploreBucketBox.tags = ExploreBucketObject.tags
	ExploreBucketBoxThumb = new ExploreBucketThumb
		x:index*(.8*padding+thumbSize*0.8)
	ExploreBucketBoxThumb.parent = ExploreBucketThumbnailsContainer.content
	ExploreBucketBoxThumb.thumb.image = ExploreBucketBox.thumbnail.image
	ExploreBucketBoxThumb.label.text = ExploreBucketObject.name
	ExploreBucketBox.thumb = ExploreBucketBoxThumb
	ExploreBucketBox.thumb.state = "default"
	ExploreBucketBoxes.push(ExploreBucketBox)	
					


#Gallery
# Bottom Tabs Gallery
class Filters extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width/5
		@options.height = Screen.width/5
		@options.backgroundColor = "#eeeeee"
		
		@Thumbnail = new Layer	
		
		@FilterName = new TextLayer
		
		super @options
		
		@Thumbnail.parent = @
		@FilterName.parent = @
		
		@Thumbnail.width = @options.width/2
		@Thumbnail.height = @options.height/2
		@Thumbnail.x = Align.center
		@Thumbnail.y =Align.top(6)
		@Thumbnail.scale = 0.7
		#@Thumbnail.backgroundColor = "#000000"
		
		@FilterName.fontSize = 12
		@FilterName.width = @options.width * 0.8
		@FilterName.height = @options.height /2
		@FilterName.color = "#333333"
		@FilterName.padding = @options.width * 0.05
		@FilterName.textAlign = "center"
		@FilterName.x = Align.center
		@FilterName.y = Align.bottom(8)

# Card Component
class card extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width/4
		@options.height = Screen.width/4
		#@options.image = Utils.randomImage()
		@options.borderColor = "#ffffff"
		@options.borderWidth = 3
		@options.type = "audio"
		
		@identity = new TextLayer
		@icon = new Layer
		super @options
		
		@identity.parent = @
		@identity.fontSize = 9
		@identity.color = "#eeeeee"
		@identity.backgroundColor = "#eeeeee"
		@identity.width = 12
		@identity.height = 12
		@identity.x = Align.right(-2)
		@identity.y = Align.top(8)
		@identity.textAlign = "center"
		@identity.text ?= "A"
		@identity.fontWeight = "bold"
		@identity.borderRadius = 3
		
		@icon.parent = @identity
		@icon.width = 8
		@icon.height = 8
		@icon.x = Align.center()
		@icon.y = Align.center()
		#@icon.backgroundColor = "#333"

#Day Component
class Day extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width
		@options.backgroundColor = "#fefefe"
		@options.y ?= 0
		
		@DayName = new TextLayer
		@DayContent = new Layer
		super @options
		
		@DayName.parent = @
		@DayName.text = ""
		@DayName.fontSize = 18
		@DayName.padding = 12
		@DayName.color = "#333333"
		
		@DayContent.parent = @
		@DayContent.y = @DayName.height
		@DayContent.width = Screen.width
		@DayContent.height ?= 400
		@DayContent.backgroundColor = "#ffffff"

#Home
#class NavButtons
class bottomNavBtn extends Layer
	constructor: (@options={}) ->
		@options.width = Screen.width/5
		@options.height = Screen.width/5
		@options.backgroundColor = "null"
		@options.borderRadius = 6
		
		@Thumbnail = new Layer
		
		#@navName = new TextLayer
		
		super @options
		
		@Thumbnail.parent = @
		@Thumbnail.width = @options.width/2
		@Thumbnail.height = @options.height/2
		#@Thumbnail.backgroundColor = "#345"
		@Thumbnail.x = Align.center
		@Thumbnail.y = Align.center(-4)
		@Thumbnail.borderRadius = 6
		@Thumbnail.scale = 0.7
		###
		@navName.truncate = true
		@navName.parent = @
		@navName.height = @options.height/2
		@navName.width = @options.width
		@navName.fontSize = 12
		@navName.textAlign = "center"
		@navName.color = "#444444"
		@navName.x = Align.center
		@navName.y = Align.bottom(8)
		@navName.padding = @options.width * 0.05
		###

# ComposeType Class
class composeType extends Layer
	constructor: (@options={}) ->
		@options.width = 64
		@options.height = 64
		@options.borderRadius = @options.height/2
		@options.y = Align.top()
		#@options.backgroundColor = "#ffdb00"
		@options.shadowY = 4
		@options.shadowBlur = 8
		@options.shadowColor = "rgba(0,0,0,0.2)"
		
		@composeText = new TextLayer
		super @options
		@composeText.width = 64
		@composeText.parent = @
		@composeText.fontSize = 14
		@composeText.y = Align.bottom(4*padding)
		@composeText.x = Align.center()
		#composeText.textAlign = "center"
		@composeText.text = "Home"

# All Screens
Gallery = new Layer
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width
GalleryHeader = new Header
	parent: Gallery
GalleryHeader.ScreenName.text = "Gallery"
GalleryHeader.NextImage.opacity = 0

GalleryBody = new Layer
	parent: Gallery
	y: GalleryHeader.height
	width: Screen.width
	height: Screen.height - GalleryHeader.height
	backgroundColor: "null"

Draft = new Layer
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width*5
	z:3
DraftHeader = new Header
	parent: Draft
DraftHeader.ScreenName.text = "Draft"
DraftHeader.NextImage.opacity = 0
DraftBody = new Layer
	parent: Draft
	y: GalleryHeader.height
	width: Screen.width
	height: Screen.height - GalleryHeader.height
	backgroundColor: "null"



Home = new Layer
	backgroundColor: "white"
	size: Screen.size
HomeHeader = new Header
	parent: Home
HomeHeader.ScreenName.text = "Home"
HomeHeader.Back.backgroundColor = "null"
HomeHeader.BackImage.opacity = 0
HomeHeader.NextImage.opacity = 0
HomeBody = new Layer
	parent: Home
	y: GalleryHeader.height
	width: Screen.width
	backgroundColor: "null"

Text = new Layer
	z: 2
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width * 2
	
TextHeader = new Header
	parent: Text
TextHeader.ScreenName.text = "Text"
#TextHeader.Back.image = "Images/Icons/ActionsIcons/right-arrow-forward.png"
TextBody = new Layer
	parent: Text
	y:TextHeader.height
	width: Screen.width
	height: Screen.height - TextHeader.height
	backgroundColor: "white"
	
horizontalTagSelect = new Layer
	z: 3
	x: Align.center, y: Screen.midY
	width: Screen.width, height: Screen.height/2
	borderRadius: 16
	backgroundColor: "white"
	shadowBlur: 10, shadowY: 1, shadowColor: "gray"
	name: "horizontalTagSelect"
	visible: false

Camera = new Layer
	z: 3
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width * 3

CameraHeader = new Header
	parent: Camera
	backgroundColor: "null"
	shadowY: 0
	shadowColor: "null"
CameraHeader.ScreenName.text = "Camera"


ImageEdit = new Layer
	z: 4
	x: Screen.width*4
	backgroundColor: "#fff"
ImageHeader = new Header
	parent: ImageEdit
	backgroundColor: "null"
	shadowY: 0
	shadowColor: "null"
ImageHeader.ScreenName.text = "Image Edit"
ImageBody = new Layer
	parent: ImageEdit
	y:ImageHeader.height
	width: Screen.width
	height: Screen.height - ImageHeader.height
	backgroundColor: "#fff"
	image: "null"
ImageContainer = new Layer
	parent: ImageBody
	width: Screen.width
	height: Screen.width
	x: Align.center()
	y:Align.center()




TagSelect = new Layer
	z: 4
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width * 4

TagSelectHeader = new Header
	parent: TagSelect
TagSelectHeader.ScreenName.text = "Select Tag"
TagSelectHeader.NextImage.opacity = 0
TagSelectBody = new Layer
	parent: TagSelect
	y: Align.top(TagSelectHeader.height)
	width: Screen.width
	height: Screen.height - TagSelectHeader.height
	backgroundColor: "white"



Upload = new Layer
	z:5
	backgroundColor: "white"
	size: Screen.size
	x: Screen.width *5
	name: "Upload"
UploadHeader = new Header
	parent: Upload
	backgroundColor: "null"
	shadowY: 0
	shadowColor: "null"
UploadHeader.ScreenName.text = "Uploading"
UploadHeader.CloseImage.opacity = 1
UploadHeader.BackImage.opacity = 0

UploadBody = new Layer
	parent: Upload
	y: UploadHeader.height
	width: Screen.width
	backgroundColor: "null"
	height: Screen.height - UploadHeader.height

UploadContainer = new Layer
	parent: UploadBody
	y: Align.center
	x: Align.center
	width: Screen.width
	height: Screen.width
	backgroundColor: "#ccc"




#flow
flow = new FlowComponent
flow.showNext(Home)

#navBtns Array
NavbtnsInfo = [
	{
		"icon": "#333333", "name": "Home", "dataType": "ALL"
	},
	{
		"icon": "#343333", "name": "Explore", "dataType": "I"
	},
	{
		"icon": "#353333", "name": "Compose", "dataType": "V"
	},
	{
		"icon": "#363633", "name": "Message", "dataType": "A"
	},
	{
		"icon": "#373333", "name": "Profile", "dataType": "G"
	},
]

#bottomNavBar
bottomNav = new Layer
	parent: Home
	width: Screen.width
	height: 64
	backgroundColor: "#FAF7F7"
	y: Align.bottom()
	shadowY: -1
	shadowColor: "rgba(0,0,0,0.2)"
	shadowBlur: 3
	z: 1

navButtons = []

for info,i in NavbtnsInfo
	btn = new bottomNavBtn
	btn.x = 0 + (i * btn.width)
	navButtons.push(btn)
	image: iconsData.navIcons[i].link
	btn.parent = bottomNav
	btn.name = info.name
	btn.Thumbnail.image = iconsData.navIcons[i].link
	if info.dataType == "A"
		btn.onClick ->
			guiding.visible = false
			HomeHeader.ScreenName.text = "Explore"
			explore.visible = true
			HomeBody.addChild explore
			bgComposeTypeParent.states.switchInstant "two"
	else if info.dataType == "V"
		btn.onClick ->
			guiding.visible = true
			HomeHeader.ScreenName.text = "Home"
			explore.parent = null
			flow.showPrevious()
			explore.visible = false
			if bgComposeTypeParent.state == "two"
				bgComposeTypeParent.stateCycle("two", "one")	
			else
				bgComposeTypeParent.stateCycle("one", "two")
			overlay.stateCycle("one","two")
			animationB.start()
			animationB.on Events.AnimationEnd, animationA.start
	else
		btn.onClick ->
			HomeHeader.visible = true
			

#composeTypeArray
composeTypeArray = [
	{
		"name":"Drafts",icon: "#333"
	},
	{
		"name":"Gallery",icon: "#333"
	},
	{
		"name":"Text",icon: "#333"
	},
	{
		"name":"Camera",icon: "#333"
	},
]

#Compose Parent Layer
bgComposeTypeParent = new Layer
	parent: Home
	width: Screen.width - padding
	height: 180
	x: Align.center()
	y: Align.bottom(bottomNav.height * 3)
	backgroundColor: "#fff"
	borderRadius: 6
	
	

composeTypeParent = new Layer
	parent: bgComposeTypeParent
	width: Screen.width
	height: 80
	backgroundColor: "null"
	y: Align.center()
	x: Align.center()

bgComposeTypeParent.states =
	one:
		y: Align.bottom(-bottomNav.height - padding/2)
		animationOptions: curve: "spring"
	two:
		y: Align.bottom(bottomNav.height * 3)
		animationOptions: curve: "spring"

ComposeTypeButtons = []

for info,i in composeTypeArray
	type = new composeType
		x: padding + (i * (composeTypeParent.width/4))
		parent: composeTypeParent
		image: iconsData.ugc[i].link
		name: composeTypeArray[i].name + "Btn"
	type.composeText.textAlign = "center"
	type.composeText.text = composeTypeArray[i].name
	ComposeTypeButtons.push(type)
		




homeScroll = new ScrollComponent
	parent: HomeBody
	size: Screen.size
	scrollHorizontal: false

overlay = new Layer
	parent: HomeBody
	size: Screen.size
	backgroundColor: "#000"
	backgroundBlur: 10

overlay.states =
	"one":
		opacity: 0
	"two":
		opacity: 0.6

overlay.states.switchInstant "one"

feed = new Layer
	image: "images/feed.jpg"
	parent: homeScroll.content
	width: Screen.width
	height: Screen.height * 2

ComposeTypeButtons[0].onClick ->
	flow.showNext(Draft)
# 
# navButtons[2].onClick ->
# 	bgComposeTypeParent.stateCycle("one","two")
# 	overlay.stateCycle("one","two")

#print overlay.states.current.name 

if overlay.states.current.name == "two"
	overlay.onClick ->
		bgComposeTypeParent.stateCycle("one","two")
		overlay.stateCycle("one","two")

ComposeTypeButtons[1].onClick ->
	flow.showNext(Gallery)

ComposeTypeButtons[2].onClick ->
	flow.showNext(Text)

#for i in [0...4]
	#print ComposeTypeButtons[i]
		

#Gallery parent Scroll
scroll = new ScrollComponent
	width: Screen.width
	height: Screen.height *2
	scrollHorizontal: false
	parent: GalleryBody
scroll.contentInset = 
	bottom: 240

#bottomBarInfo Array
BottomBarInfo = [
	{
		"icon": "images/Icons/typeIcons/image.png", "name": "All", "dataType": "ALL"
	},
	{
		"icon": "images/Icons/typeIcons/image.png", "name": "Image", "dataType": "I"
	},
	{
		"icon": "images/Icons/typeIcons/video.png", "name": "Video", "dataType": "V"
	},
	{
		"icon": "images/Icons/typeIcons/audio.png", "name": "Audio", "dataType": "A"
	},
	{
		"icon": "images/Icons/typeIcons/gif.png", "name": "GIF", "dataType": "G"
	},
]

#Gallery function
BotttomBar = new Layer
	width: Screen.width
	height: Screen.width/5
	y: Align.bottom
	z: 1
	parent: GalleryBody

BottomTabs = []

scrollGallery = new ScrollComponent
	width: Screen.width
	height: Screen.height - 140
	y: 0
	scrollHorizontal: false
	parent: GalleryBody
	backgroundColor: "#fff"
#scrollGallery.content.height = Screen.height*2

for info, i in BottomBarInfo
	Tab = new Filters
	Tab.Thumbnail.image = info.icon
	Tab.FilterName.text = info.name
	Tab.x = 0 + (i * Screen.width/5)
	Tab.name = info.name
	Tab.dataType = info.dataType
	BottomTabs.push(Tab)
	Tab.parent = BotttomBar


#funtion to resize the day component
reSize = (theDay) ->
	theDay.DayContent.height = (rowIndex + 1) * cardWidth
	theDay.height= theDay.DayName.height + theDay.DayContent.height

iu = ""

columnCount = 4
cardWidth = Screen.width/4

cards = []

daysData = [
	{
		"name": Object.keys(galleryData)[0], "id": "draft"
	},
	{
		"name": Object.keys(galleryData)[1], "id": "day1"
	},
	{
		"name": Object.keys(galleryData)[2], "id": "day2"
	}
]

days = []

YDay = 0

for a in [0...Object.keys(galleryData).length]
	newDay = new Day
	newDay.DayName.text = daysData[a].name
	newDay.y = YDay
	newDay.parent = scrollGallery.content
	

	newDay.name = daysData[a].name
	#print "Y"
	days.push(newDay)
	length = galleryData[daysData[a].name].length
	
	for index in [0...length]
			columnIndex = index % columnCount
			rowIndex = Math.floor(index / columnCount)
		
			caard = new card
				x: (columnIndex * cardWidth)
				y: rowIndex * cardWidth
				parent: newDay.DayContent
				image: galleryData[daysData[a].name][index].thumb
			caard.identity.text = galleryData[daysData[a].name][index].dataType
			caard.icon.image = galleryData[daysData[a].name][index].icon
			cards.push(caard)
		
		reSize(newDay)
		YDay += newDay.height
		dataTypeVariable = ""

for i in [0...cards.length]
	cards[i].onClick ->
		iu = @.image
		flow.showNext(ImageEdit)
		ImageContainer.image = iu
		


o = 0

for i in [0...5]
	BottomTabs[i].onClick ->
		#print "ya"
		dataTypeVariable = this.dataType
		#print dataTypeVariable
		for a in [0...days.length]
			days[a].destroy()
			
		Xday = 0
		days = []
		
		index = -1
		for a in [0...Object.keys(galleryData).length]
			newDay = new Day
			newDay.DayName.text = daysData[a].name
			newDay.y = Xday
			newDay.parent = scrollGallery.content
			newDay.name = daysData[a].name
			#print "Y"
			days.push(newDay)
			length = galleryData[daysData[a].name].length
			
			if dataTypeVariable == "ALL"
				for indx in [0...length]
					columnIndex = indx % columnCount
					rowIndex = Math.floor(indx / columnCount)
				
					caard = new card
						x: (columnIndex * cardWidth)
						y: rowIndex * cardWidth
						parent: newDay.DayContent
						image: galleryData[daysData[a].name][indx].thumb
					caard.icon.image = galleryData[daysData[a].name][indx].icon
					caard.identity.text = galleryData[daysData[a].name][indx].dataType
					cards.push(caard)
			else
				#print galleryData[daysData[a].name].length
				for z in [0...galleryData[daysData[a].name].length]
					if dataTypeVariable == galleryData[daysData[a].name][z].dataType
						#print "YES"
						index++
						columnIndex = index % columnCount
						rowIndex = Math.floor(index / columnCount)
						
						caard = new card
							x: (columnIndex * cardWidth)
							y: (rowIndex) * cardWidth
							parent: newDay.DayContent
							image: galleryData[daysData[a].name][z].thumb
						caard.icon.image = galleryData[daysData[a].name][z].icon
						caard.identity.text = galleryData[daysData[a].name][z].dataType
						cards.push(caard)
			reSize(newDay)
			Xday += newDay.height
			index = -1
		for i in [0...cards.length]
			cards[i].onClick ->
				iu = @.image
				flow.showNext(ImageEdit)
				ImageContainer.image = iu





GalleryHeader.Back.onClick ->
	flow.showPrevious()

#Text Functions
profile = new profileHead
	parent: Text
	y: TextHeader.height
	name: "profile"	
	
profile.ProfileTag.states.switchInstant "select"
profile.ProfileName.text = "Sohil"
profile.ProfileBio.text = "Bhokal toh m hee hu.. baaki ka pata nhi"
	
profile.ProfileTag.onClick ->
	profile.ProfileTag.states.switchInstant "selecting"
	Input.unfocus() 
	flow.showOverlayBottom(horizontalTagSelect)

InputText = new Layer
	parent: Text
	width: Screen.width - (2 * padding)
	x: padding
	y: TextHeader.height + padding + profile.height
	borderRadius: 8
	backgroundColor: "#ef3f61"

InputText.states =
	one:
		backgroundColor: "#ef3f61"
	two:
		backgroundColor: "#3a3a59"
	three:
		backgroundColor: "#99e1e5"
	four:
		backgroundColor: "#4e709d"
InputText.states.switchInstant "one"

Input = new InputModule.Input
	setup: false
	parent: InputText
	virtualKeyboard: true 
	placeholder: "Kuch to likh hi do" 
	placeholderColor: "#ccc"
	fontSize: 20
	fontWeight: 300
	y: Align.top(padding) # y position
	x: Align.left(padding)  # x position
	textColor: "#FFFFFF"
	width: (InputText.width - 4*padding)
	height: (InputText.height - 4*padding)
	textarea: true


TextFunctions = new Layer
	parent: Text
	width: Screen.width
	backgroundColor: "null"
	height: HeaderHeight
	x: 0
	y: Align.bottom(-padding)


BoldFuntion = new Layer
	parent: TextFunctions
	x: Align.left(padding)
	y: Align.center()
	width: TextFunctions.height - 2*padding
	height: TextFunctions.height - 2*padding
	borderRadius: 100
	backgroundColor: "#fff"
	#image: "images/Icons/ActionIcons/bold.png"
	shadowY: 4
	shadowBlur: 8
	shadowColor: "rgba(0,0,0,0.14)"

bfImage = new Layer
	parent: BoldFuntion
	x: Align.center()
	y: Align.center()
	width: TextFunctions.height - 2*padding
	height: TextFunctions.height - 2*padding
	scale: 0.5
	image: "images/Icons/ActionIcons/bold.png"

PasteFunction = new Layer
	parent: TextFunctions
	x: Align.right(-4*padding - BoldFuntion.width)
	y: Align.center()
	width: TextFunctions.height * 2.5
	height: TextFunctions.height - 2*padding
	borderRadius: 100
	backgroundColor: "#fff"
	shadowY: 4
	shadowBlur: 8
	shadowColor: "rgba(0,0,0,0.14)"
PasteIcon = new Layer
	parent: PasteFunction
	width: PasteFunction.height - 0.8*padding
	height: PasteFunction.height - 0.8*padding
	image: "images/Icons/ActionIcons/05.png"
	y: Align.center()
	x: Align.left(padding)
	borderRadius: 20
	style = backgroundSize: "Contain"

PasteText = new TextLayer
	parent: PasteFunction
	fontSize: 14
	color: "#333"
	x: Align.center(padding)
	y: Align.center()
	text: "Paste Clipboard"

ColorFuntion = new Layer
	parent: TextFunctions
	x: Align.right(-padding)
	y: Align.center()
	width: TextFunctions.height - 2*padding
	height: TextFunctions.height - 2*padding
	borderRadius: 100
	borderWidth: 2
	borderColor: "white"
	backgroundColor: "#fff"
	shadowY: 4
	shadowBlur: 8
	shadowColor: "rgba(0,0,0,0.14)"
ColorFuntion.states =
	one:
		backgroundColor: "#ef3f61"
	two:
		backgroundColor: "#3a3a59"
	three:
		backgroundColor: "#99e1e5"
	four:
		backgroundColor: "#4e709d"


ColorFuntion.states.switchInstant "one"

ColorFuntion.onClick ->
	ColorFuntion.stateCycle("one","two","three","four")
	InputText.stateCycle("one","two","three","four")

AlignFunction = new Layer
	parent: TextFunctions
	x: Align.left(2*padding + BoldFuntion.width)
	y: Align.center()
	width: TextFunctions.height - 2*padding
	height: TextFunctions.height - 2*padding
	borderRadius: 100
	backgroundColor: "#fff"
	shadowY: 4
	shadowBlur: 8
	shadowColor: "rgba(0,0,0,0.14)"

ALignImage = new Layer
	parent: AlignFunction
	x: Align.center()
	y: Align.center()
	width: TextFunctions.height - 2*padding
	height: TextFunctions.height - 2*padding
	scale: 0.5
	image: "images/Icons/ActionIcons/04.png"

blurOpacityLayer = new Layer
	size: Text.size
	parent: Text
	blur: 6
	visible: false
# 
# blurOpacityLayer.onClick ->
# 	print("yay")
# 	@.visible = false
# 	flow.showPrevious()
# 
#Text All Functions 
TextHeader.Back.onClick ->
	flow.showPrevious()

Input.onFocus ->
	TextFunctions.y = Align.bottom(-300)

Input.onBlur ->
	TextFunctions.y = Align.bottom(-padding)




PasteFunction.onClick ->
	Input.value = Input.value + "We have pasted your clipboard here."

#Input.style.states.switchInstant "Regular"

BoldFuntion.onClick ->
	if Input.style.fontWeight == "300"
		Input.style.fontWeight = 500
	else if Input.style.fontWeight == "500"
		Input.style.fontWeight = 700
	else Input.style.fontWeight = 300


AlignFunction.onClick ->
	if Input.style.textAlign == "left"
		Input.style.textAlign = "center"
	else if Input.style.textAlign == "center"
		Input.style.textAlign = "right"
	else Input.style.textAlign = "left"


TextHeader.ExtraFeature.onClick ->
		flow.showNext(TagSelect)



#Horizontal Tag Select

rows = horizontalTagsData.buckets.length
gutter = 20
horizontalBucketSize = 56
tagWidthRatio = 0.20
scalefactor = 1
borderRadius = 8

focusedFrame = new PageComponent
	backgroundColor: "transparent"
	borderWidth: 6, borderRadius: borderRadius, borderColor: "rgba(255,255,255,0)"
	width: horizontalBucketSize*1.4, height: horizontalBucketSize*1.4
	shadowBlur: 6, shadowY: 1, shadowColor: "gray"
	x: Align.center, y: Align.bottom(-padding)
	parent: horizontalTagSelect
	z: 1
	clip: false
	scrollVertical: false

centerFrame = focusedFrame.screenFrame
centerPoint = Utils.frameCenterPoint(centerFrame)

class horizontalBucket extends Layer
	constructor: (@options={}) ->
		@options.width = horizontalBucketSize
		@options.height = horizontalBucketSize
		@options.parent = focusedFrame.content
		@options.borderRadius = borderRadius
		@options.scale = 1
		
		
		@thumbnail = new Layer
			borderRadius:  borderRadius

		super @options
		
		@thumbnail.parent = @
		@thumbnail.width = horizontalBucketSize*0.7
		@thumbnail.height = horizontalBucketSize*0.7	
		@thumbnail.center()
		@thumbnail.style = backgroundSize: "contain"
		
		@onClick ->
			focusedFrame.snapToPage(@)
			@.states.switchInstant "active"
			
		@states=
			"active":
				opacity: 1
				scale: 1
			"default":
				opacity: 0.6
				scale: 0.98
			

horizontalBuckets = []
middleObjectIndex = Math.round(rows/2) - 1
scaleForIndex = (index) ->
	if index != middleObjectIndex
		return Math.pow scalefactor, Math.abs(middleObjectIndex - index)
	else
		return 1

for horizontalBucketObject, index in horizontalTagsData.buckets
		cell = new horizontalBucket
			name: "horizontalBucket #{index+1}"
			x: index*(gutter+horizontalBucketSize) + padding
			backgroundColor: horizontalBucketObject.backgroundColor, opacity: scaleForIndex(index)
		cell.thumbnail.image = horizontalBucketObject.image
	
		cell.centerY()
		cell.scale = scaleForIndex(index)
		cell.data = horizontalBucketObject
		horizontalBuckets[index] = cell


horizontalTags = [0...10]
tagLayers = []
tagsContainer = new ScrollComponent
	width: Screen.width*0.9, height: horizontalTagSelect.height
	y: 0, x: Align.center
	parent: horizontalTagSelect

tagsContainer.scrollHorizontal = false
tagsContainer.content.backgroundColor = "transparent"
tagsContainer.backgroundColor = "transparent"
tagsContainer.mouseWheelEnabled = true
tagsContainer.visible = true
tagsContainer.content.clip = false
tagsContainer.contentInset = 
		top: padding
		bottom: padding	

tittle = new TextLayer
	y: Align.top
	textAlign: Align.center
	fontWeight: "bold"
	fontSize: 20
	color: "black"
	parent: tagsContainer.content

blurLayer = new Layer
	parent: horizontalTagSelect
	y: Align.bottom(-padding)
	height: horizontalBucketSize*1.4
	width: Screen.width
	backgroundColor: "white"
	blur: 30
	opacity: 0.9
		
class Tag extends Layer
	constructor: (@options={}) ->
		@options.height = @options.width*tagWidthRatio
		@options.backgroundColor = "transparent"
		@options.borderRadius = borderRadius
		@options.shadowBlur = 6
		@options.shadowY = 1
		@options.shadowColor = "gray"
		autoSize: true
		clip: true
		
		@label = new TextLayer
			width: 0.9*@options.width
			x: Align.left(8), y: Align.center
			fontSize: 16
			name: ".label"
			color: "black"
			clip: true
# 		
# 		@trendLabel = new TextLayer
# 			fontSize: 12
# 			name: ".trendLabel"
# 			color: "black"
# 			clip: true
# 			
# 		@trendIcon = new Layer
# 			width: 1.83*0.3*@options.height, height: 0.3*@options.height
# 			y: Align.center
# 
			
		super @options
		
		@onClick ->
			flow.showPrevious()
			flow.showNext(Upload)
			selectedTag = this.text
			uploadProfile.ProfileTag.text = selectedTag
			if flow.current.name == "Upload"
					uploading.animate "two",
						delay: 0.5
						time: Utils.randomNumber(2,4)
# 			profile.ProfileTag.text = @label.text
# 			profile.ProfileTag.backgroundColor = "#eed"
# 			profile.ppTag.opacity = 0
# 			profile.ProfileTag.borderWidth = 0
			
		
		@label.parent = @
		@label.centerY()
		@label.backgroundColor = "transparent"
		
# 		@trendLabel.parent = @
# 		@trendLabel.centerY()
# 		@trendLabel.x = @trendIcon.x +  @trendIcon.width + 4
# 		@trendLabel.backgroundColor = "transparent"
# 		
# 		@trendIcon.parent = @
# 		@trendIcon.centerY()
# 		@trendIcon.x = @label.x + @label.width + 4
# 		@trendIcon.image = "images/trend.png"
		
yPosition = tittle.height + tittle.y

for tagObject, tagIndex in horizontalTags
	tagWidth = (tagsContainer.width-1.2*padding)/2
	tagHeight = 48
	tagLayer = new Tag
		width: tagWidth
	xPosition = if (tagIndex%2 != 0 and tagIndex !=0) then tagWidth + padding 				else 0.2*padding
	yPosition = tittle.height + tittle.y + padding + (Math.floor(tagIndex/2)) *(tagHeight)
	tagLayer.parent = tagsContainer.content
	tagLayer.x = xPosition
	tagLayer.y = yPosition
	tagLayer.label.text = ""
# 	tagLayer.trendLabel.text = ""	
	tagLayer.visible = false
	tagLayers.push(tagLayer)	

focusedFrame.on "change:currentPage", ->
	
		current = focusedFrame.verticalPageIndex(focusedFrame.currentPage)
		focusedhorizontalBucket = horizontalBuckets[current]
		tagsContainer.scrollToTop()
		focusedhorizontalBucketIndex = horizontalBuckets.indexOf(focusedhorizontalBucket)
		tittle.text = focusedhorizontalBucket.data.name
		tittle.centerX()
		
		for tagLay in tagLayers
			tagLay.visible = false 
		
		for tagObject, tagIndex in focusedhorizontalBucket.data.tags when tagIndex < horizontalTags.length
			tagLayer = tagLayers[tagIndex]
			
			tagLayer.label.text = tagObject.name.slice(0, 16);
# 			tagLayer.trendLabel.x = tagLayer.trendIcon.x + tagLayer.trendIcon.width + 4
# 			tagLayer.trendIcon.x = tagLayer.label.x + tagLayer.label.width + 4
# 			roundOff = Math.round(tagObject.noOfShares/10)
# 			if roundOff > 100 
# 				roundOff = Math.round(roundOff/100)
# 			tagLayer.trendLabel.text = roundOff + "k"
			tagLayer.visible = true	

		for horizontalBucket, index in horizontalBuckets 
			if index != current
				horizontalBucket.states.switchInstant "default"
			else 
				horizontalBucket.states.switchInstant "active"

focusedFrame.snapToPage(focusedFrame.content.children[4])

#camera Functions
cameraLayerViewV = new Layer
	parent: Camera
	width: Screen.width
	height: Screen.height * 0.7
	x: Align.center()
	y: Align.top()

shutter = new Layer
	parent: Camera
	width: HeaderHeight
	height: HeaderHeight
	borderColor: "#63aebb"
	backgroundColor: "#e6e6d4"
	borderWidth: 6
	x: Align.center()
	y: Align.top(cameraLayerViewV.height + 4*padding)
	borderRadius: HeaderHeight/2

CameraHeader.Back.onClick ->
	flow.showPrevious()

FinalImageView = new Layer
	parent: ImageEdit
	width: Screen.width
	height: Screen.height/1.5
	y: Align.bottom()
	visible: false



shutter.onClick ->
	cameraLayerObject.capture()
	cameraLayerObject.stop()
	flow.showNext(ImageEdit)

CameraLayer = require "CameraLayer"
# Create a CameraLayer
cameraLayerObject = new CameraLayer()
cameraLayerObject.parent = cameraLayerViewV
cameraLayerObject.bounds = cameraLayerViewV.bounds
cameraLayerObject.frame = cameraLayerViewV.frame

ComposeTypeButtons[3].onClick ->
	flow.showNext(Camera)
	cameraLayerObject.start()
	
# Start accessing a camera device
shutter.onClick ->
	cameraLayerObject.capture()
	cameraLayerObject.stop()
	flow.showNext(ImageEdit)

	cameraLayerObject.onCapture (imageURL) ->
		finalImageLayer = new Layer
			x: FinalImageView.x
			y: FinalImageView.y
			width: FinalImageView.width
			height: FinalImageView.height
			image: imageURL
			parent: FinalImageView.parent
		
		#finalImageLayer.placeBehind(FinalImageView)
		FinalImageView.visible = false


#Draft Funtion
scroll = new ScrollComponent
	width: Screen.width
	height: Screen.height/2
	y: height
	scrollHorizontal: false
	parent: DraftBody
scroll.contentInset = 
	bottom: 240

columnCount = 4
cardWidth = Screen.width/4

cards = []

length = galleryData.Draft.length

for index in [0...length]
		columnIndex = index % columnCount
		rowIndex = Math.floor(index / columnCount)
	
		caard = new card
			x: (columnIndex * cardWidth)
			y: rowIndex * cardWidth
			parent: scroll.content
			image: galleryData.Draft[index].thumb
		caard.identity.text = galleryData.Draft[index].dataType
		cards.push(caard)

DraftHeader.Back.onClick ->
	flow.showPrevious()

for i in [0...cards.length]
	cards[i].onClick ->
		iu = @.image
		flow.showNext(ImageEdit)
		ImageContainer.image = iu


ImageHeader.ExtraFeature.onClick ->
	flow.showNext(TagSelect)

#imageEdit

profile = new profileHead
	parent: ImageEdit
	y: TextHeader.height
profile.ProfileTag.text = "Select tag"
profile.ProfileName.text = "Sohil"
profile.ProfileBio.text = "Bhokal toh m hee hu.. baaki ka pata nhi"
profile.ProfileTag.onClick ->
	flow.showNext(TagSelect)

ImageHeader.Back.onClick ->
	flow.showPrevious()
	ImageContainer.image = null




#Tag scroll

#bucket Scroll

selectedTag = ""

bucketArray = []

bucketsBG = new Layer
	parent: TagSelectBody
	height: Screen.height - 2*HeaderHeight - padding
	width: Screen.width * 0.40
	y: Align.bottom(0)
	x: Align.right()
	backgroundColor: "null"


selected = new Layer
	parent: bucketsBG
	backgroundColor: "null"
	borderColor: "#666"
	borderWidth: 2
	borderRadius: 12
	width: bucketsBG.width - 4*padding
	height: bucketsBG.width - 4*padding
	x: Align.center
	y: Align.center(-4*padding)

scrollBucket = new PageComponent
	parent: selected
	height: selected.height
	width: selected.width
	scrollHorizontal: false
	x: Align.center(2)
	y: Align.center(2)
	clip: false
scrollBucket.content.backgroundColor = "null"

for i in [0...tagsData.buckets.length]
	mazedar = new bucket
		name: tagsData.buckets[i].bucketName
		backgroundColor: tagsData.buckets[i].backgroundColor
		#hueRotate: i * 10
		x: Align.center(0)
		y: 2*padding + (i * (bucketsBG.width - 5*padding))
		parent: scrollBucket.content
		scale: 0.6
		#@bucketImage.image = tagsData.buckets[i].image
		
	mazedar.states = 
		active: 
			scale: 0.8
			opacity: 1
	mazedar.bucketImage.image = tagsData.buckets[i].image
	bucketArray.push(mazedar)
	mazedar.onClick ->
		scrollBucket.snapToPage(this)

scrollBucket.content.height += padding
 
scrollBucket.snapToPage(scrollBucket.content.children[4])
scrollBucket.content.children[4].states.switch ("active")

scrollBucket.onChange "currentPage", ->
	mazedar.states.switch("default") for mazedar in bucketArray
	current = scrollBucket.horizontalPageIndex(scrollBucket.currentPage)
	bucketArray[current].states.switch("active")



#Tags Scroll

tagsBG = new Layer
	parent: TagSelectBody
	height: Screen.height - 2*HeaderHeight - padding
	width: Screen.width * 0.60
	y: Align.bottom(0)
	x: Align.left()
	backgroundColor: "null"

scrollTag = new ScrollComponent
	height: Screen.height
	width: tagsBG.width - 2*padding
	scrollHorizontal: false
	x: Align.left(padding)
	parent: tagsBG


tagsArray = []
u = 4
for i in [0...tagsData.buckets[u].tagsInBuckets.length]
	tags = new tag
		parent: scrollTag.content
		width: (scrollTag.content.width - padding)
		y: 0 + (i * (height + 2.5*padding))
		text: "#" + tagsData.buckets[u].tagsInBuckets[i].tagName
	#tags.height = ( tags.fontSize * tags.lineHeight ) * 1
	#tags.textOverflow = "ellipsis"
	tagsArray.push(tags)
for s in [0...tagsArray.length]
	tagsArray[s].onClick ->
		flow.showNext(Upload)
		selectedTag = this.text
		uploadProfile.ProfileTag.text = selectedTag
		if flow.current.name == "Upload"
				uploading.animate "two",
					delay: 0.5
					time: Utils.randomNumber(2,4)
	
scrollBucket.on "change:currentPage", ->
	j = scrollBucket.currentPage.id
	t = bucketArray[0].id
	k = (j - t)/2
	for l in [0...tagsData.buckets[u].tagsInBuckets.length]
		tagsArray[l].destroy()
	u = k
	tagsArray = []
	for i in [0...tagsData.buckets[k].tagsInBuckets.length]
		tags = new tag
			parent: scrollTag.content
			width: (scrollTag.content.width - padding)
			y: 0 + (i * (height + 2.5*padding))
			text: "#" + tagsData.buckets[k].tagsInBuckets[i].tagName
		#tags.height = ( tags.fontSize * tags.lineHeight ) * 1
		#tags.textOverflow = "ellipsis"
		tagsArray.push(tags)
	#headerBucket.backgroundColor = tagsData.buckets[k].backgroundColor
	headerBucket.bucketImage.image = tagsData.buckets[k].image
	headerName.text = tagsData.buckets[k].bucketName
	for s in [0...tagsArray.length]
		tagsArray[s].onClick ->
			flow.showNext(Upload)
			selectedTag = this.text
			uploadProfile.ProfileTag.text = selectedTag
			if flow.current.name == "Upload"
				uploading.animate "two",
					delay: 0.5
					time: Utils.randomNumber(2,4)
				

TagSelectHeader.Back.onClick ->
	flow.showPrevious()


header = new Layer
	parent: TagSelectBody
	width: Screen.width
	height: HeaderHeight
	y: 0
	backgroundColor: "#eee"

headerBucket = new bucket
	parent: header
	name: tagsData.buckets[4].name
	backgroundColor: "#00AAFF"
	scale: 0.4
	opacity: 1
	x: Align.left(-padding)
	y: Align.top(-padding)
headerBucket.bucketImage.image = tagsData.buckets[4].image

headerName = new TextLayer
	parent: header
	x: Align.left(headerBucket.width/1.5)
	y: Align.center()
	fontSize: 20
	fontWeight: 400
	color: "#333"
	text: tagsData.buckets[4].bucketName




#upload Screen

uploadProfile = new profileHead
	parent: UploadBody
	@.ProfileTag = ""
uploadProfile.ProfileName.text = "Sohil"
uploadProfile.ProfileBio.text = "Bhokal toh m hee hu.. baaki ka pata nhi"
uploadProfile.ProfileTag.backgroundColor = "#eed"
uploadProfile.ppTag.opacity = 0
uploadProfile.ProfileTag.borderWidth = 0

uploadingBG = new Layer
	parent: UploadBody
	width: Screen.width - 2*padding
	x: Align.center()
	height: 2*padding
	y: Align.center()
	borderRadius: padding
	backgroundColor: "#ddd"

uploading = new Layer
	originX: 0
	originY: 0.5
	parent: uploadingBG
	x: Align.left()
	height: 2*padding
	y: Align.center()
	borderRadius: padding
	backgroundColor: "#ef3f61"

uploading.states =
	one:
		width: 0
	two:
		width: Screen.width - 2*padding

uploading.states.switchInstant "one"

Done = new Layer
	parent: Upload
	width: Screen.width - padding
	height: 4*padding
	x: Align.center()
	y: Align.bottom(-padding/2)
	backgroundColor: "#9661BA "
	borderRadius: 8

DoneText = new TextLayer
	parent: Done
	x: Align.center()
	y: Align.center()
	fontSize: 20
	text: "Done"
	color: "#fff"

Sharing = new Layer
	parent: Upload
	width: Screen.width/2 - padding
	height: 4*padding
	x: Align.left(padding/2)
	y: Align.bottom(-padding * 5.5)
	borderRadius: 8
	borderColor: "#FF5A7E"
	borderWidth: 2

Sharing.states =
	"one":
		backgroundColor: "#FF5A7E"
	"two":
		backgroundColor: "#ffffff"

Sharing.states.switchInstant "one"

SharingText = new TextLayer
	parent: Sharing
	x: Align.center()
	y: Align.center()
	width: Screen.width/2 - 3*padding
	fontSize: 16
	textAlign: "center"
SharingText.states =
	"one":
		text: "Sharing"
		color: "#fff"
	"two":
		text: "Sharing"
		color: "#666"
SharingText.states.switchInstant "one"

Sharing.onClick ->
	SharingText.stateCycle("one","two")
	Sharing.stateCycle("one","two")
	Sharing.animationOptions =
		time: 0.1


Commeting = new Layer
	parent: Upload
	width: Screen.width/2 - padding
	height: 4*padding
	x: Align.right(-padding/2)
	y: Align.bottom(-padding * 5.5)
	borderRadius: 8
	borderColor: "#FF5A7E"
	borderWidth: 2

Commeting.states =
	"one":
		backgroundColor: "#FF5A7E"
	"two":
		backgroundColor: "#ffffff"

Commeting.states.switchInstant "one"

CommetingText = new TextLayer
	parent: Commeting
	x: Align.center()
	y: Align.center()
	width: Screen.width/2 - 3*padding
	fontSize: 16
	textAlign: "center"
CommetingText.states =
	"one":
		text: "Commenting"
		color: "#fff"
	"two":
		text: "Commenting"
		color: "#666"
CommetingText.states.switchInstant "one"

Commeting.onClick ->
	CommetingText.stateCycle("one","two")
	Commeting.stateCycle("one","two")
	Commeting.animationOptions =
		time: 0.1


Cancel = new Layer
	parent: UploadContainer
	width: Screen.width/2 - padding
	height: 4*padding
	x: Align.center()
	y: Align.center(padding * 7)
	borderRadius: 8
	backgroundColor: "#666666"

CancelText = new TextLayer
	parent: Cancel
	x: Align.center()
	y: Align.center()
	width: Screen.width/2 - 3*padding
	fontSize: 16
	color: "#eee"
	textAlign: "center"
	text: "Cancel"

Cancel.onClick ->
	flow.showPrevious()

UploadHeader.ExtraFeature.onClick ->
	flow.showNext(Home)

Done.onClick ->
	flow.showNext(Home)

uploading.onAnimationEnd ->
	Cancel.destroy()

UploadHeader.Back.onClick ->
	flow.showPrevious()


#guiding animation

guiding = new Layer
	parent: Home
	width: Screen.width
	height: 64
	y: Align.bottom(-bottomNav.height)
	backgroundColor: "#FF5A7E"
	originX: 0
	originY: 1

guidingArrow = new Layer
	parent: guiding
	width: guiding.height/3
	height: guiding.height/3
	x: Align.center()
	y:Align.bottom(guiding.height/6)
	backgroundColor: "#FF5A7E"
	rotation: 45
	z:2
	

guidingText = new TextLayer
	parent: guiding
	x: Align.center()
	y: Align.center()
	color: "white"
	text: "Create your art!"
	fontSize: 16

animationA = new Animation guiding,
	y: Screen.height
	options:
		time: 0.2

animationB = new Animation guidingArrow,
	scale: 0
	options:
		#delay: 3
		time: 0.08

# navButtons[2].onClick ->
# 	animationB.start()
# 	animationB.on Events.AnimationEnd, animationA.start



