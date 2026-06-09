const vscode = require('vscode');

const XAP = 'xmlns:app="http://schemas.android.com/apk/res-auto"';
const ALE = 'androidLayoutEditor';

const AA = {
  layout_width: { t: 'e', v: ["match_parent", "wrap_content", "100dp", "200dp"] },
  layout_height: { t: 'e', v: ["match_parent", "wrap_content", "100dp", "200dp"] },
  layout_margin: { t: 'd' },
  layout_marginTop: { t: 'd' },
  layout_marginBottom: { t: 'd' },
  layout_marginLeft: { t: 'd' },
  layout_marginRight: { t: 'd' },
  layout_marginStart: { t: 'd' },
  layout_marginEnd: { t: 'd' },
  layout_padding: { t: 'd' },
  layout_weight: { t: 'f' },
  layout_gravity: { t: 'e', v: ["top", "bottom", "left", "right", "center", "center_vertical", "center_horizontal", "start", "end"] },
  id: { t: 'i' },
  background: { t: 'cr' },
  padding: { t: 'd' },
  paddingTop: { t: 'd' },
  paddingBottom: { t: 'd' },
  paddingLeft: { t: 'd' },
  paddingRight: { t: 'd' },
  visibility: { t: 'e', v: ["visible", "invisible", "gone"] },
  alpha: { t: 'f' },
  elevation: { t: 'd' },
  rotation: { t: 'f' },
  scaleX: { t: 'f' },
  scaleY: { t: 'f' },
  text: { t: 's' },
  textSize: { t: 'd' },
  textColor: { t: 'c' },
  hint: { t: 's' },
  textColorHint: { t: 'c' },
  textAlignment: { t: 'e', v: ["inherit", "gravity", "center", "textStart", "textEnd", "viewStart", "viewEnd"] },
  maxLines: { t: 'n' },
  singleLine: { t: 'b' },
  ellipsize: { t: 'e', v: ["start", "middle", "end", "marquee"] },
  textStyle: { t: 'e', v: ["normal", "bold", "italic", "bold|italic"] },
  clickable: { t: 'b' },
  enabled: { t: 'b' },
  inputType: { t: 'e', v: ["text", "textPassword", "number", "phone", "textEmailAddress", "textUri", "textMultiLine", "numberPassword", "numberSigned", "numberDecimal"] },
  imeOptions: { t: 'e', v: ["actionDone", "actionGo", "actionNext", "actionSearch", "actionSend", "actionNone", "flagNoExtractUi"] },
  src: { t: 'r' },
  scaleType: { t: 'e', v: ["center", "centerCrop", "centerInside", "fitCenter", "fitXY", "fitStart", "fitEnd", "matrix"] },
  contentDescription: { t: 's' },
  checked: { t: 'b' },
  orientation: { t: 'e', v: ["vertical", "horizontal"] },
  gravity: { t: 'e', v: ["top", "bottom", "left", "right", "center", "center_vertical", "center_horizontal", "start", "end", "clip_vertical", "clip_horizontal"] },
  layout_constraintLeft_toLeftOf: { t: 'i' },
  layout_constraintLeft_toRightOf: { t: 'i' },
  layout_constraintRight_toLeftOf: { t: 'i' },
  layout_constraintRight_toRightOf: { t: 'i' },
  layout_constraintTop_toTopOf: { t: 'i' },
  layout_constraintTop_toBottomOf: { t: 'i' },
  layout_constraintBottom_toTopOf: { t: 'i' },
  layout_constraintBottom_toBottomOf: { t: 'i' },
  layout_constraintStart_toStartOf: { t: 'i' },
  layout_constraintStart_toEndOf: { t: 'i' },
  layout_constraintEnd_toStartOf: { t: 'i' },
  layout_constraintEnd_toEndOf: { t: 'i' },
  layout_constraintBaseline_toBaselineOf: { t: 'i' },
  layout_constraintHorizontal_bias: { t: 'f' },
  layout_constraintVertical_bias: { t: 'f' },
  layout_constraintHorizontal_chainStyle: { t: 'e', v: ["spread", "spread_inside", "packed"] },
  layout_constraintVertical_chainStyle: { t: 'e', v: ["spread", "spread_inside", "packed"] },
  layout_constraintWidth_default: { t: 'e', v: ["spread", "wrap", "percent"] },
  layout_constraintHeight_default: { t: 'e', v: ["spread", "wrap", "percent"] },
  layout_constraintWidth_percent: { t: 'f' },
  layout_constraintHeight_percent: { t: 'f' },
  layout_constraintDimensionRatio: { t: 's' },
  layout_constraintCircle: { t: 'i' },
  layout_constraintCircleRadius: { t: 'd' },
  layout_constraintCircleAngle: { t: 'f' },
  layout_editor_absoluteX: { t: 'd' },
  layout_editor_absoluteY: { t: 'd' },
  layout_goneMarginLeft: { t: 'd' },
  layout_goneMarginTop: { t: 'd' },
  layout_goneMarginRight: { t: 'd' },
  layout_goneMarginBottom: { t: 'd' },
  layout_goneMarginStart: { t: 'd' },
  layout_goneMarginEnd: { t: 'd' },
  minWidth: { t: 'd' },
  minHeight: { t: 'd' },
  layout_alignParentTop: { t: 'b' },
  layout_alignParentBottom: { t: 'b' },
  layout_alignParentLeft: { t: 'b' },
  layout_alignParentRight: { t: 'b' },
  layout_alignParentStart: { t: 'b' },
  layout_alignParentEnd: { t: 'b' },
  layout_centerInParent: { t: 'b' },
  layout_centerHorizontal: { t: 'b' },
  layout_centerVertical: { t: 'b' },
  layout_alignTop: { t: 'i' },
  layout_alignBottom: { t: 'i' },
  layout_alignLeft: { t: 'i' },
  layout_alignRight: { t: 'i' },
  layout_alignStart: { t: 'i' },
  layout_alignEnd: { t: 'i' },
  layout_alignBaseline: { t: 'i' },
  layout_toLeftOf: { t: 'i' },
  layout_toRightOf: { t: 'i' },
  layout_toStartOf: { t: 'i' },
  layout_toEndOf: { t: 'i' },
  layout_above: { t: 'i' },
  layout_below: { t: 'i' },
  layout_toLeftOf: { t: 'i' },
  layout_toRightOf: { t: 'i' },
  layout_toStartOf: { t: 'i' },
  layout_toEndOf: { t: 'i' },
  layout_above: { t: 'i' },
  layout_below: { t: 'i' },
  layout_alignWithParentIfMissing: { t: 'b' },
  layout_row: { t: 'n' },
  layout_column: { t: 'n' },
  layout_rowSpan: { t: 'n' },
  layout_columnSpan: { t: 'n' },
  layout_columnWeight: { t: 'f' },
  layout_rowWeight: { t: 'f' },
  layout_gravity: { t: 'e', v: ["top", "bottom", "left", "right", "center", "center_vertical", "center_horizontal", "start", "end", "clip_vertical", "clip_horizontal", "fill", "fill_vertical", "fill_horizontal"] },
  layout_span: { t: 'n' },
  layout_weight: { t: 'f' },
  layout_alignParentTop: { t: 'b' },
  layout_alignParentBottom: { t: 'b' },
  layout_alignParentLeft: { t: 'b' },
  layout_alignParentRight: { t: 'b' },
  layout_alignParentStart: { t: 'b' },
  layout_alignParentEnd: { t: 'b' },
  layout_centerInParent: { t: 'b' },
  layout_centerHorizontal: { t: 'b' },
  layout_centerVertical: { t: 'b' },
  layout_alignTop: { t: 'i' },
  layout_alignBottom: { t: 'i' },
  layout_alignLeft: { t: 'i' },
  layout_alignRight: { t: 'i' },
  layout_alignStart: { t: 'i' },
  layout_alignEnd: { t: 'i' },
  layout_alignBaseline: { t: 'i' },
  layout_toLeftOf: { t: 'i' },
  layout_toRightOf: { t: 'i' },
  layout_toStartOf: { t: 'i' },
  layout_toEndOf: { t: 'i' },
  layout_above: { t: 'i' },
  layout_below: { t: 'i' },
  layout_alignWithParentIfMissing: { t: 'b' },
  layout_row: { t: 'n' },
  layout_column: { t: 'n' },
  layout_rowSpan: { t: 'n' },
  layout_columnSpan: { t: 'n' },
  layout_columnWeight: { t: 'f' },
  layout_rowWeight: { t: 'f' },
  layout_gravity: { t: 'e', v: ["top", "bottom", "left", "right", "center", "center_vertical", "center_horizontal", "start", "end", "clip_vertical", "clip_horizontal", "fill", "fill_vertical", "fill_horizontal"] },
  layout_span: { t: 'n' },
  layout_weight: { t: 'f' }
};

const DP = {
  'pixel-7': { n: 'Pixel 7', w: 1080, h: 2400, dn: 'xxhdpi', sc: 3 },
  'pixel-7a': { n: 'Pixel 7a', w: 1080, h: 2400, dn: 'xxhdpi', sc: 3 },
  'galaxy-s23': { n: 'Galaxy S23', w: 1080, h: 2340, dn: 'xxhdpi', sc: 3 },
  'galaxy-s23-ultra': { n: 'Galaxy S23 Ultra', w: 1440, h: 3088, dn: 'xxxhdpi', sc: 4 },
  'iphone-15': { n: 'iPhone 15', w: 1179, h: 2556, dn: 'xxxhdpi', sc: 3 },
  'ipad-air': { n: 'iPad Air', w: 1640, h: 2360, dn: 'xhdpi', sc: 2 },
  'small-phone': { n: 'Small Phone', w: 720, h: 1280, dn: 'hdpi', sc: 2 },
  'tablet-10': { n: '10" Tablet', w: 1280, h: 800, dn: 'mdpi', sc: 1 }
};

const DS = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const AW = {
  layouts: [
    { t: 'LinearLayout', i: 'layout-linear', d: '线性布局' },
    { t: 'ConstraintLayout', i: 'layout-constraint', d: '约束布局' },
    { t: 'FrameLayout', i: 'layout-frame', d: '帧布局' },
    { t: 'RelativeLayout', i: 'layout-relative', d: '相对布局' },
    { t: 'ScrollView', i: 'scroll', d: '滚动视图' },
    { t: 'HorizontalScrollView', i: 'scroll-h', d: '水平滚动视图' }
  ],
  widgets: [
    { t: 'TextView', i: 'text', d: '文本视图' },
    { t: 'Button', i: 'button', d: '按钮' },
    { t: 'EditText', i: 'edittext', d: '编辑框' },
    { t: 'ImageView', i: 'image', d: '图片视图' },
    { t: 'ImageButton', i: 'image-btn', d: '图片按钮' },
    { t: 'CheckBox', i: 'checkbox', d: '复选框' },
    { t: 'RadioButton', i: 'radio', d: '单选按钮' },
    { t: 'Switch', i: 'switch', d: '开关' },
    { t: 'ProgressBar', i: 'progress', d: '进度条' },
    { t: 'SeekBar', i: 'seekbar', d: '滑动条' },
    { t: 'Spinner', i: 'spinner', d: '下拉列表' },
    { t: 'RecyclerView', i: 'recycler', d: '列表视图' }
  ],
  containers: [
    { t: 'CardView', i: 'card', d: '卡片视图' },
    { t: 'include', i: 'include', d: '包含布局' },
    { t: 'merge', i: 'merge', d: '合并布局' },
    { t: 'ViewStub', i: 'stub', d: '视图存根' }
  ]
};

const LW = new Set([
  'TextView', 'Button', 'EditText', 'ImageView', 'ImageButton',
  'CheckBox', 'RadioButton', 'Switch', 'ProgressBar', 'SeekBar',
  'Spinner', 'ViewStub', 'View'
]);

const LT = [
  {
    n: 'Login Form',
    l: 'LoginForm',
    ds: 'LinearLayout + 2 EditText + Button',
    dt: '登录表单布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Login"
        android:textSize="28sp"
        android:textStyle="bold"
        android:layout_marginBottom="24dp" />

    <EditText
        android:id="@+id/etUsername"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:hint="Username"
        android:inputType="text"
        android:layout_marginBottom="16dp" />

    <EditText
        android:id="@+id/etPassword"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:hint="Password"
        android:inputType="textPassword"
        android:layout_marginBottom="24dp" />

    <Button
        android:id="@+id/btnLogin"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:text="Login"
        android:background="#7c3aed"
        android:textColor="#ffffff" />
</LinearLayout>`
  },
  {
    n: 'List Item',
    l: 'ListItem',
    ds: 'ConstraintLayout + ImageView + 2 TextView',
    dt: '列表项布局',
    x: `<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    ${XAP}
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:padding="12dp">

    <ImageView
        android:id="@+id/ivIcon"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:src="@drawable/ic_launcher"
        android:contentDescription="Item icon"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="Title"
        android:textSize="16sp"
        android:textStyle="bold"
        android:layout_marginStart="12dp"
        app:layout_constraintStart_toEndOf="@id/ivIcon"
        app:layout_constraintTop_toTopOf="@id/ivIcon"
        app:layout_constraintEnd_toEndOf="parent" />

    <TextView
        android:id="@+id/tvSubtitle"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:text="Subtitle text"
        android:textSize="14sp"
        android:textColor="#666666"
        android:layout_marginStart="12dp"
        android:layout_marginTop="4dp"
        app:layout_constraintStart_toEndOf="@id/ivIcon"
        app:layout_constraintTop_toBottomOf="@id/tvTitle"
        app:layout_constraintEnd_toEndOf="parent" />
</androidx.constraintlayout.widget.ConstraintLayout>`
  },
  {
    n: 'Bottom Navigation',
    l: 'BottomNav',
    ds: 'LinearLayout + 4 ImageButton',
    dt: '底部导航栏布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="56dp"
    android:orientation="horizontal"
    android:background="#ffffff"
    android:elevation="8dp"
    android:gravity="center">

    <ImageButton
        android:id="@+id/btnNavHome"
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:src="@drawable/ic_home"
        android:contentDescription="Home"
        android:background="?attr/selectableItemBackgroundBorderless" />

    <ImageButton
        android:id="@+id/btnNavSearch"
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:src="@drawable/ic_search"
        android:contentDescription="Search"
        android:background="?attr/selectableItemBackgroundBorderless" />

    <ImageButton
        android:id="@+id/btnNavAdd"
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:src="@drawable/ic_add"
        android:contentDescription="Add"
        android:background="?attr/selectableItemBackgroundBorderless" />

    <ImageButton
        android:id="@+id/btnNavProfile"
        android:layout_width="0dp"
        android:layout_height="match_parent"
        android:layout_weight="1"
        android:src="@drawable/ic_person"
        android:contentDescription="Profile"
        android:background="?attr/selectableItemBackgroundBorderless" />
</LinearLayout>`
  },
  {
    n: 'Settings Item',
    l: 'SettingsItem',
    ds: 'LinearLayout + TextView + Switch',
    dt: '设置项布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="56dp"
    android:orientation="horizontal"
    android:paddingHorizontal="16dp"
    android:gravity="center_vertical"
    android:background="?attr/selectableItemBackground">

    <TextView
        android:id="@+id/tvSettingTitle"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:text="Setting Title"
        android:textSize="16sp" />

    <Switch
        android:id="@+id/switchSetting"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginStart="16dp" />
</LinearLayout>`
  },
  {
    n: 'Empty State',
    l: 'EmptyState',
    ds: 'LinearLayout + ImageView + TextView + Button',
    dt: '空状态布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="32dp">

    <ImageView
        android:id="@+id/ivEmptyIcon"
        android:layout_width="120dp"
        android:layout_height="120dp"
        android:src="@drawable/ic_empty_state"
        android:contentDescription="No data"
        android:layout_marginBottom="24dp" />

    <TextView
        android:id="@+id/tvEmptyTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="No Data Found"
        android:textSize="20sp"
        android:textStyle="bold"
        android:layout_marginBottom="8dp" />

    <TextView
        android:id="@+id/tvEmptyMessage"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Try adding some items or check back later."
        android:textSize="14sp"
        android:textColor="#666666"
        android:gravity="center"
        android:layout_marginBottom="24dp" />

    <Button
        android:id="@+id/btnEmptyAction"
        android:layout_width="wrap_content"
        android:layout_height="48dp"
        android:text="Add Item"
        android:paddingHorizontal="32dp" />
</LinearLayout>`
  },
  {
    n: 'Card Item',
    l: 'CardItem',
    ds: 'CardView + ImageView + TextView',
    dt: '卡片项布局',
    x: `<androidx.cardview.widget.CardView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:card_view="http://schemas.android.com/apk/res-auto"
    android:id="@+id/cardView"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp"
    card_view:cardCornerRadius="12dp"
    card_view:cardElevation="4dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <ImageView
            android:id="@+id/ivCardImage"
            android:layout_width="match_parent"
            android:layout_height="180dp"
            android:src="@drawable/card_cover"
            android:scaleType="centerCrop"
            android:contentDescription="Card cover image" />

        <TextView
            android:id="@+id/tvCardTitle"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Card Title"
            android:textSize="18sp"
            android:textStyle="bold"
            android:padding="16dp" />
    </LinearLayout>
</androidx.cardview.widget.CardView>`
  },
  {
    n: 'Dialog Layout',
    l: 'DialogLayout',
    ds: 'LinearLayout + Title + Message + 2 Button',
    dt: '对话框布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:padding="24dp">

    <TextView
        android:id="@+id/tvDialogTitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Dialog Title"
        android:textSize="20sp"
        android:textStyle="bold"
        android:layout_marginBottom="16dp" />

    <TextView
        android:id="@+id/tvDialogMessage"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="This is the dialog message. Are you sure you want to proceed?"
        android:textSize="14sp"
        android:textColor="#666666"
        android:layout_marginBottom="24dp" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="end">

        <Button
            android:id="@+id/btnDialogCancel"
            android:layout_width="wrap_content"
            android:layout_height="40dp"
            android:text="Cancel"
            android:layout_marginEnd="8dp"
            android:backgroundTint="#e0e0e0"
            android:textColor="#333333" />

        <Button
            android:id="@+id/btnDialogConfirm"
            android:layout_width="wrap_content"
            android:layout_height="40dp"
            android:text="Confirm"
            android:background="#7c3aed"
            android:textColor="#ffffff" />
    </LinearLayout>
</LinearLayout>`
  },
  {
    n: 'AppBar Layout',
    l: 'AppBarLayout',
    ds: 'Toolbar + ScrollView',
    dt: '应用栏布局',
    x: `<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <Toolbar
        android:id="@+id/toolbar"
        android:layout_width="match_parent"
        android:layout_height="56dp"
        android:background="#7c3aed"
        android:title="App Title"
        android:titleTextColor="#ffffff"
        android:elevation="4dp" />

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:fillViewport="true">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="Content Area"
                android:textSize="22sp"
                android:textStyle="bold"
                android:layout_marginBottom="16dp" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="This is a scrollable content area. Add your content here."
                android:textSize="14sp"
                android:lineSpacingMultiplier="1.5" />
        </LinearLayout>
    </ScrollView>
</LinearLayout>`
  }
];

module.exports = { XAP, ALE, AA, DP, DS, AW, LW, LT };
