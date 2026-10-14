// Community MIX / koujou memo → MIXDEX seed text.
// Header:  # English name / 日本語名 | Category | Bars | Trigger context | flags
// flags: b2 / b4 = baisoku (2x / 4x) passages, id=slug
// Body: see parse.js for the chant DSL.
export const SEED_TEXT = String.raw`
# Myohontusuke Square (Starter Call) / ミョーホントゥスケ広場（発動付き） | Language Variant | 4 | Pre-intro | id=kahen-starter
> The chant follows the MCH memo's rows. Sho documents 「はい、せーの！」 as an optional pre-intro starter and groups the chant into fewer rows.
【発動】はい、せーの！
ミョーホントゥスケ
化繊飛除去
ジャージャー ファイボ
ワイパー

# Konton MIX (Foldback ending) / 混沌MIX（折り返しの後半） | Advanced | 0 | After the forward Konton MIX | id=konton-gyaku
> This is the returning half of the forward-to-reverse foldback: six しょ calls, then 翔襲叉 back through the phrases to ワールドカオス. The standalone reverse form instead starts with 世界混沌 無常 黒雲.
しょ×4
しょ×2 翔襲叉
金剛山 神楽 時雨
木暮 諸行 ワールドカオス

# Konton MIX (Standalone reverse) / 混沌MIX（単独逆打ち） | Advanced | 10 |  | id=konton-reverse
> The source documents this reverse as a separate 10-bar option: 「世界混沌」 is the initiator, followed by the reverse sequence.
【発動】世界混沌
無常 黒雲 翔襲叉
金剛山 神楽 時雨
木暮 諸行 ワールドカオス

# Hayashi-sensei MIX / 林先生MIX | Basic | 0 |  | pending | id=hayashi
> No provided source documents this full named chant or call-and-response. The Ginga article separately documents a repeated うりゃおい lead-in, but does not attribute this stanza to Hayashi or verify its placement.
ウリャ オイ ウリャ オイ
ウリャ オイ ウリャ オイ
👏 👏 👏 👏
まだいかない

ウリャ オイ ウリャ オイ
ウリャ オイ ウリャ オイ
👏 👏 👏 👏
まだいかない いついくの？
今でしょー！
あー！ しゃー！ いくぞ！

# Pan MIX (Short) / パンMIX（短縮） | Theme | 8 |  | id=pan-short
> Follows the Wiki's four-Pan form. The MCH longer forms start with three Pan calls; Sho also adds 「俺の！」 responses.
パン パン パン パン ポケモンパン
フレッシュブレッド 伊藤パン
松たか子！ 松たか子
ヤマザキ春のパンまつり!

# Hindi Accele / ヒンディー（ヒンドゥー）アッチェレ | Advanced | 0 |  | id=hindi-accele
> Source speed markings by displayed row: row 2 is 2×; row 4 starts at 2× and switches to 4× at バーグ; row 5 is 4×; row 6 is 2× or normal depending on the song.
ケート ニルティヤ パクシー クードナー
ハターナ ウダーン クリトリマタントゥー カンパン ゴタコー タントゥ サイバラ
バー アグ バー アグ
バーバーバーバー バーグ サイトゥゴタカンパン
ゴタパンゴタパンゴタカンパン ゴタトゥゴタトゥサイバラアグ
バー アグ サイバラ タントゥ ゴタコー カンパン クリトリマタントゥー
ウダーン ハターナ クードナー
パクシー ニルティヤ ケート

# Thomas MIX / トーマスmix | Theme | 0 |  | id=thomas
【発動】出発進行
トーマス ゴードン ヘンリー パーシー
トビー エドワード ポッポー

# Thomas MIX (James variant) / トーマスMIX（ジェームス版） | Theme | 0 |  | id=thomas-james
> The Idol Sengoku Jidai wiki documents ジェームス in the third slot, while the 2025 Onshitsuha roundup uses ヘンリー. These are retained as distinct source versions. Timing is not established here.
【発動】出発進行
トーマス
ゴードン
ジェームス
パーシー
トビー
エドワード
ポッポー

# Suirenka Kashou / 睡蓮花歌唱 | Theme | 0 |  | id=suirenka
> The ranking post gives the prompt and response only; it does not establish timing or placement.
○○で沸けるの誰ですか？
俺！×4 ore！×2

# Ginga Koujou (Galaxy Koujou) / 銀河口上 | Koujou | 12 |  | phrases | id=ginga
> The article describes a 12-bar form and a longer form after the separate うりゃおい/clap starter. Its tentative history links early-2010s use to Idol College's "Seifuku Koi Monogatari" and later use to Nijicon's "Paradoxical Complex"; the author explicitly warns that this history may be inaccurate.
銀河に轟く歌声と
地球に花咲くその笑顔
お前が好きだと輝き叫ぶ
行くぜ全力どこまでも
光のごとく駆け巡る
好きじゃねぇ 愛してる

# Ginga Koujou — Cancel Italian / 銀河口上キャンセルイタリア | Advanced | 0 |  | phrases | id=ginga-italian
> The final 愛してる is swapped for the Italian MIX start call (アンディアモ), the usual way Ginga is cancelled into another MIX.
銀河に轟く歌声と
地球に花咲くその笑顔
お前が好きだと輝き叫ぶ
行くぜ全力どこまでも
光のごとく駆け巡る
好きじゃねぇ アンディアモ

ティーグレ フオーコ レプリカンテ フィーブラ
バロンバーロ ヴィヴラメント テクノボラーレ
アスティラッツィオーネ

# Rascal MIX / ラスカルmix | Theme | 0 |  | id=rascal
> By Takeutin. "三生オタク" = a fan reborn with every oshi change. 丸の内 is the creator's old Nagoya address. Many derivatives exist (see the Yoji-con list).
ラスカルラスカルラスカルラスカル
あ～👏👏丸の内
清川みれぴに ゆーほ
ガチ恋加速が止まらない
結婚は ごめんなさい
三生オタクラスカルズ
たけうてぃん たけうてぃん
たけうちまさやって知ってる？
[すーえーなーがーかーのーちゃーん！]

# Gachikoi Rascal Kahen / ガチ恋ラスカル可変 | Theme | 0 |  | id=rascal-gachikoi
言いたいラスカルあるんだよ
やっぱり君は丸の内
好き好き大好き後藤まつり
やっと見つけた 止まらない
俺が産まれてごめんなさい
それはオタクラスカルズ
俺と一緒にたけうていん
たけうちまさや愛してる

# Ultimate Rascal / アルティメットラスカル | Theme | 0 |  | id=rascal-ultimate
> Identical text is circulated as "Captain Rascals" (キャプテンラスカルズ).
言いたいことがファイボラスカル
やっぱりまさやはグリフィンタイガー
アクシオチャペアペ丸の内
ガチ恋まさやとお姫様
ファイヤー俺と結婚カラキナ
それはファーマーごめんなさい
俺とタイガーラスカルズ
たけうちまさやでイェッタイガー

# Yoruba MIX / ヨルバ語mix | Language Variant | 0 |  | id=yoruba
> Yoruba is spoken in south-west Nigeria. Its "除去" slot is ヨ, which makes the reverse form (Gachikoi Yoruba) slot neatly into a Gachi Koi cancel.
【発動】エジェカロ
アモテクン イナ イシェオウォエニヤン
オウ オビンリンオルウェオミ イジヤ
[オウケミカリ フォ ヨ]

# Ura Yoruba (Yoruba 2-ren) / 裏ヨルバ（ヨルバ語2連） | Language Variant | 0 |  | id=yoruba-2
【発動】エジェカロ
アモテクン イナ イシェオウォエニヤン
オウ オビンリンオルウェオミ イジヤ
エジャエニヤン オリシャオビンリン
ケレシメシ エランオデクン
アンジェリ シンデレラ
アアイェ イレアライェアジェサラ

# Yoruba 3-Ren / ヨルバ語3連 | Advanced | 0 |  | id=yoruba-3
【発動】エジェカロ
アモテクン イナ イシェオウォエニヤン
オウ オビンリンオルウェオミ イジヤ
エジャエニヤン オリシャオビンリン
ケレシメシ エランオデクン
アンジェリ シンデレラ
アアイェ イレアライェアジェサラ
エフォイナ イナティンジョ
イラウォアリワジュロ
イラウォプレイアデス オルンイラウォ

# Gachikoi Yoruba (Gyaku-uchi) / ガチ恋ヨルバ（逆打ち） | Advanced | 0 |  | id=yoruba-gachikoi
> Cancel at 「やっぱり○○は可愛いヨ」: the Yoruba reverse starts on that ヨ. The article describes this transition as particularly smooth; its comparison with other language cancels is subjective.
言いたいことがあるんだよ
やっぱり○○は可愛いヨ
フォ オウケミカリ イジヤ
オビンリン オルウェオミ オウ
イシェオウォエニヤン
イナ アモテクン エジェカロ

# Japanese MIX (Short Ending) / ジャパニーズ（最後を短縮） | Basic | 0 |  | id=jp-short
虎 火
人造 繊維
海女 振動
化繊飛除去(かっせんとびじょーきょー)

# Japanese MIX (Tora-Hi Hatsudou) / 日本語MIX（虎火発動） | Language Variant | 0 |  | id=jp-torahi
虎×12 虎 火 人造 繊維 海女 振動 化繊 飛 除去

# Japanese MIX (Gyaku-uchi) / 日本語MIX（逆打ち） | Advanced | 0 |  | b2 | id=jp-gyaku
虎 火 人造 繊維 海女 振動 化繊 飛 除去 飛 化繊 振動 海女 繊維 人造 火 [倍速]
虎 虎 火 火 人造 人造 繊維 繊維 海女 振動 化繊 飛 除去

# Ainu MIX (Sunny) / アイヌ（晴） | Language Variant | 0 |  | id=ainu-sun
カムイ ホロカプ
アーホイヨ

# Ainu MIX (Rain) / アイヌ（雨） | Language Variant | 0 |  | id=ainu-rain
カムイ ポプニカ
アーホイヨ

# Enchou MIX / 園長 | Language Variant | 0 |  | id=enchou
ファイボ ワイパー
ファーマー ジャスパー
ホワイパー クーパー
イエスクレイパー

# Miyamoto Musashi (Enchou Japa) / 宮本武蔵（園長ジャパ） | Language Variant | 0 |  | id=musashi
飛 除去
農 正
拭 樽
宮本武蔵

# Kurofuku MIX / 黒服 | Language Variant | 0 |  | id=kurofuku
ファイボ ワイパー
ジャンパー ピンガー
ダンス ファーマー
[サブリ フィンガー]
[セイブ バイザー]

# Spanish MIX (1-ren) / スペイン（1連で終わるやつ） | Language Variant | 0 |  | id=spanish-1
【発動】バーモス
ティグレ フェゴ
シベル フィブラ
ブゾ ビブラル
ヘルセイ
[ボラーレ リンピラ
パラブリサス]

# Spanish MIX (2-3 ren) / スペイン（2連～3連） | Language Variant | 0 |  | id=spanish-3
【発動】バーモス
ティグレ フェゴ
シベル フィブラ
ブゾ ビブラル
シーレナ ディオサ

ナビダ レノ
アンヘル セニシエンタ
エスパンシオン パイースデラス
マラビーシャス

[チスパ ジャーマ
ポラール プレイアディ
シエロエストレジャード]

# German MIX / ドイツ | Language Variant | 0 |  | id=german
【発動】ゲーエンヴィアー
ティーガァ フォイエル
クゥンスト フィーバー
タゥツァー シュビングング
ヒェーミーファーザー
[フィリーゲン カールハインツシュナイダー]

# German MIX (Ura) / 裏ドイツ | Language Variant | 0 |  | id=german-ura
【発動】ゲーエンヴィアー
ティーガァ フォイエル
クゥンスト フィーバー
タゥツァー シュビングング
ヒェーミーファーザー

フィリーゲン バザィティガン
ゼーユングファー ゲッティン
ヴァイナハテン レン
ヘルマンカルツ カールハインツシュナイダー

# German MIX (3-ren) / ドイツ3連 | Advanced | 0 |  | id=german-3
【発動】ゲーエンヴィアー
ティーガァ フォイエル
クゥンスト フィーバー
タゥツァー シュビングング
ヒェーミーファーザー

フィリーゲン バザィティガン
ゼーユングファー ゲッティン
ヴァイナハテン レン
エンゲル アッシュンプッテル

ラウム ヴンダーランド
フンケ フランメ
ポラースシュテルン プレヤデン
シュテルンツェルト
カールハインツシュナイダー

# Italian MIX / イタリア | Language Variant | 0 |  | id=italian
【発動】アンデャーモ
ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィブラメント
テクノボラーレ
[アストラッツィオーネ]

# Italian MIX (Ura) / 裏イタリア | Language Variant | 0 |  | id=italian-ura
【発動】アンデャーモ
ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィブラメント
シレーナ デーア

ナターレ レンナ
アンジェロ チェネレントラ
スパツィオ パェゼデレ
メラヴィリェ アストラッチィオーネ

# Italian MIX (3-ren) / イタリア3連 | Advanced | 0 |  | id=italian-3
【発動】アンデャーモ
ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィブラメント
シレーナ デーア

ナターレ レンナ
アンジェロ チェネレントラ
スパツィオ パェゼデレ
メラヴィリェ シンティッラ

フィアンマ ポラーレ
プレイアディ チェーロスッテラート

# Korean MIX / ハングル | Language Variant | 0 |  | id=korean
【発動】チャカダー
ホランイ ブル
インジョ ソミュ
ヘニョ シンド
ファハクソミュ
[ネウダ ジェゴ]

# Thai MIX / タイ | Language Variant | 0 |  | id=thai
シーアー ファイマイ
トローン ファイブー
ブラダーナー スターン
サンコラー ビン
カーカムチャー

# Arabic MIX / アラビア | Language Variant | 0 |  | id=arabic
【発動】スフィリアスィール
ナミル ナール
スィナーイ ナスィージュ
ガタサ ハッザ
ハイトゥンシナーイ

# Russian MIX / ロシア | Language Variant | 0 |  | id=russian
> The rhythm is uncertain in the source memo.
チーグル アゴーニ
キビェル ヴァラクノ
モーリェ バーバラ
ヴィバラツィヤ ヒーミャ
[リターチ ウダリェニエ]

# Vietnamese MIX / ベトナム | Language Variant | 0 |  | id=vietnamese
【発動】ジュントイセー
ティーガル チャイ
キーバル ソイ
トゥーラン ロン
ソイトンホップ

# Chinese MIX / 中国 | Language Variant | 0 |  | id=chinese
ラオフー フオ
レンジャオ シェンウェイ
ハイニィ ジェンドン
ホァシェン
[フェイ チュウチィ]

# Favoria Star MIX / ファボリアスター | Language Variant | 0 |  | id=favoria
ジャージャー ファイボ
インジョ ジャスパー
ビブラル 化繊
イエスクレイパー
[ナルダ ファボリアスター]

# Takemin Original Perfect / タケミンオリジナルパーフェクト | Advanced | 0 |  | id=takemin
> Timing unconfirmed in the source memo.
【発動】ジャージャー
ファイボ ワイパー
ヘルテイ カイザー
バーモス イザナギ
イエッ イザナミ

チャカダ ソミュ
ボラル ジェゴ
ホァシェン ラオフー
ジュントイセー

# Shikou / 至高 | Language Variant | 0 |  | id=shikou
ファスタスチーパ
アステステロン
パストマーブ
スタッツレーザル

スプンタアールマティ
パストビレイジョン

# Myohontusuke Square / ミョーホントゥスケ広場 | Language Variant | 4 | Often the pre-intro | id=myohon-square
ミョーホントゥスケ
化繊飛除去
ジャージャー ファイボ
ワイパー

# Myohon Driver Square / ミョーホンドライバー広場 | Language Variant | 0 |  | id=myohon-driver
ミョーホン ドライバー
化繊 飛 ライガー
ジャッジャー ジャッジャー
バリバリボー
ストストストスト
ストライパー

# Kahen 3-Ren (Original Triple) / 可変3連（本来の可変3連） | Advanced | 0 |  | id=kahen-orig
タイガー ファイヤー
サイバー ファイバー
ダイバー バイバー
ジャージャー

ファイボー ワイパー
ファーマー ジャスパー
ホワイパー クーパー
イエスクレイパー

ジャージャー ファイボ
ワイパー ジャバー
ティーガァ ジャス
パーナ

# Kahen 3-Ren (4-ren length) / 可変3連（4連の尺があるやつ） | Advanced | 0 |  | id=kahen-4ren
人造ファイヤファイボワイパー
タイガータイガー
タタタタタイガー

チャペアペカラキナ
チャペアペカラキナ
ミョーホントゥスケ
👏 ワイパー

ファイヤーファイヤー
虎虎カラキナ
チャペアぺファーマー
海女海女ジャスパー

虎タイガー
虎タイガー
人造繊維
イエッタイガー

# Kahen 3-Ren 2 / 可変3連2 | Advanced | 0 |  | id=kahen-2
人造ファーマ繊維ジャスパー
ダイバーダイバー
ダダダダダイバー

虎火除去飛
虎火除去飛
ミョーホントゥスケ
ストライパー

ファイターファイター
人造チャペアペ
除去飛サイダー
カラキナワイパー

海女ダイバー
海女ダイバー
ワールドカオス
イエッダイバー

# Ainu-Nichi Kahen / アイ日可変 | Advanced | 8 |  | id=ainu-nichi
ウィースぺ ケスィ
チャペ チャペ チャペ
チャペ アぺ カラ キナ
カラ アぺ チャペ

除去 飛 除去
虎 虎 虎
虎 火 人造 繊維
海女 振動 化繊
[飛 除去]

# Captain Tsubasa Kahen 3-Ren / キャプテン翼可変3連 | Advanced | 16 |  | id=tsubasa
キタキタ キタキタ
ワイテキタ
タイガー タイガー
タイガーショット

虎タイ 虎タイ
虎タイガー
人造繊維
イエッタイガー

ジャッジャー ジャッジャー
バリバリボー
ストスト ストスト
ストライカー

カール ハインツ
シュナイダー
スカイ ラブ
ハリケーン

# Hogwarts MIX / ホグワーツ | Theme | 16 |  | id=hogwarts
> Uses the MCH memo's line breaks. The article and Sho group some calls into fewer rows; Sho uses two claps before Gryffindor, while MCH and the article use one.
マルフォイ マルフォイ
マルフォイ マルフォイ
あーーー 👏
グリフィンドール

アクシオ レダクト
ルーモス
ウィンガーディアム
レビオ―サー

貴方のは
レビオサー
エクスペクト
パトローナム

トムリドル
トムリドル
ヴォルデモートって
しってるぅ？
[ハーマイオニー
グレンジャー]

# Ultimate MIX / アルティメットMIX | Advanced | 0 |  | id=ultimate
言いたいことがファイボマルフォイ
やっぱり○○
グリフィンタイガー

アクシオチャペアペ
やっぱ好き
ウィンガートゥスケ
お姫様

ファイヤー俺と
レヴィオサカラキナ
それはファーマー
パトローナム

俺とタイガー
トムリドル
ヴォルデモートって
イェッタイガー

# Japanese 3x-speed Kahen / ジャパニーズ3倍速可変 | Advanced | 0 |  | b2 | id=jp-3x
> Called "3x" but only reaches roughly 1.5–2.0x in practice.
海女虎人造(あまとらじんぞう)
海女虎化繊(あまとらかせん)
除去虎人造(じょきょとらじんぞう)
海女繊維虎(あませんとら)

海女繊維除去飛(あませんじょきょとび)
振動繊維化繊飛(しんせんかせとび)
除去虎振動(じょきょとらしんどう)
海女虎火(あまとらひ)

# Kahen (Unnamed) / 可変（そのうち名前つける） | Advanced | 0 |  | id=kahen-unnamed
チスパ ジャーマ
舞農場
チャペ虎タイガー
ストライパー

除去飛除去
虎虎虎
振繊除去飛
海女虎火

# Kahen (Mange) / 可変（まんげ） | Advanced | 0 |  | id=kahen-mange
チャペ虎タイガー
ファーマージャスパー
イエッ まんげ
エターナル

# Kahen (Favoria Star) / 可変（ファボリアスター） | Advanced | 0 |  | id=kahen-favoria
イエッ ナルダ ファボリアスター

# Japanese Baisoku Omote-Ura / ジャパニーズ（倍速表裏） | Advanced | 0 |  | b2 | id=jp-baisoku
虎火人造繊維
海女振動化繊飛
除去飛化繊振動
海女繊維人造火

# Ainu Baisoku Kahen / アイヌ（倍速可変） | Advanced | 0 |  | b2 | id=ainu-baisoku
チャペアペカラキナ
チャペアペカラキナ
チャペアペカラキナ
ミョーホントゥスケ

# Standard-Japa-Ainu Blend / スタジャパアイヌ混合 | Advanced | 0 |  | id=blend
チャペ虎タイガー
アぺ火ファイヤー
カラ人造サイバー
キナ繊維ファイバー

ララ海女ダイバー
トゥスケ振動バイバー
イエッ ウィスペ
化繊ジャージャー

# Karan Ichishiki -Rei- / 華嵐 一式-麗- | Theme | 0 |  | id=karan
桜(サクラ) 椿(ツバキ)
菖蒲(アヤメ) 黒百合(クロユリ)
楓(カエデ) 睡蓮(スイレン)
杜若(カキツバタ)

# Hanabi MIX / 花火 | Theme | 0 |  | id=hanabi
【発動】5 4
【発動】321
菊(キク) 牡丹(ボタン)
瀧(タキ) 蜂(ハチ)
千輪(センリン) 葉落(ヨウラク)
冠菊(カムロギク)

# Seven Lucky Gods / 七福神 | Theme | 0 |  | id=shichifuku
【発動】七福即生
恵比寿 福禄
弁財 寿老
布袋 大黒
毘沙門天

# Tales MIX / テイルズ | Theme | 0 |  | id=tales
【発動】よっしゃ秘奥義
震天 裂空
斬光 旋風
滅砕 神罰
割殺撃

# Gokui / 極意 | Advanced | 0 |  | id=gokui
虎 火
人造 繊維
海女 振動
化繊 飛

除去 忠実
刹那 刻
高陽 心髄
極意 魂
伝承

# Konton MIX (Chaos, Ochisabi) / 混沌 | Advanced | 8 | Often Ochisabi; placement depends on the song | id=konton-short
【発動】ワールドカオス
諸行 木暮
時雨 神楽
金剛山
翔襲叉(しょうしゅうしゃ)
[黒雲 無常
世界混沌]

# Ashura Konton / 阿修羅混沌 | Advanced | 0 |  | id=ashura-konton
【発動】ワールドカオス
諸行 木暮
時雨 神楽
金剛山
翔襲叉

極運 夢境
冥界 強剛
ナウダ マモリア
スター

# Tanbo no Yousu / 田んぼの様子 | Theme | 0 |  | id=tanbo
農林業
水産業
魚の様子も
👏 おかしい

# Koshihikari / コシヒカリ | Theme | 0 |  | id=koshihikari
コシヒカリ
ササニシキ
イヤイヤイヤイヤ
マテマテマテマテ

# Yousuiro / 用水路 | Theme | 0 |  | id=yousuiro
用水路
コンバイン
田んぼの様子が
👏 おかしい

# Tatatata Taiga 3-Ren / タタタタタイガー3連 | Advanced | 0 |  | id=tata-3
タイガファイヤ
タタタタタイガ
サイバファイバ
サササササイバ

ダイババイバ
ダダダダダイバ
ジャージャジャージャ
ジャジャジャジャジャージャ

ファイボワイパ
ワワワワワイパ
ファーマジャスパ
ジャジャジャジャジャスパ

ホワイパクーパ
クククククーパ
イエスクレイパ
イェイェスクレイパ

ライガファイタ
ララララライガ
サイダファインダ
サササササイダ

ドライバベイベ
ドドドドドライバ
ジャッジャバリボ
ストライパ

# Tatatata Taiga 3-Ren (Full) / タタタタタイガー3連 フル | Advanced | 0 |  | id=tata-3-full
タイガファイヤ
タタタタタイガ
サイバファイバ
サササササイバ

ダイババイバ
ダダダダダイバ
ジャージャジャージャ
ジャジャジャジャジャージャ

ファイボワイパ
ワワワワワイパ
ファーマジャスパ
ジャジャジャジャジャスパ

ホワイパクーパ
クククククーパ
イエスクレイパ
イェイェスクレイパ

ライガファイタ
ララララライガ
サイダファインダ
サササササイダ

ドライバベイベ
ドドドドドライバ
ジャッジャージャッジャー
バリバリボー
ストストストスト
ストライパー

# Chikipa MIX / チキパ | Theme | 0 |  | id=chikipa
> The MCH form combines Latolata and Sagozo sections and includes eight 栄養 calls. The Wiki lists separate Latolata-full, Sagozo, 3-ren, Perfect, and variable forms. Timing is not established for this transcription.
ライオン トラ
チーター
ラタラタ ラトラーター

サイ ゴリラ
ゾウ
サゴーゾー
サゴーゾー

栄養×4
栄養×4
カプサイシンって
知ってるー？
[栄養過多で
脂肪肝]

# Chikipa MIX (Latolata Full) / チキパMIX（ラトラータフルMIX） | Theme | 0 |  | id=chikipa-latolata
ライオン
トラ
チーター
ラタラタ
ラトラーター
栄養
栄養
栄養
栄養
カプサイシンって知ってるー？

# Chikipa MIX (Sagozo) / チキパMIX（サゴーゾMIX） | Theme | 0 |  | id=chikipa-sagozo
サイ
ゴリラ
ゾウ
サゴーゾ
サゴーゾー

# Chikipa MIX (3-ren) / チキパMIX（3連） | Theme | 0 |  | id=chikipa-3ren
ライオン
トラ チーター
ラタラタ
ラトラーター
サイ
ゴリラ
ゾウ
サゴーゾ
サゴーゾー
栄養
栄養
栄養
栄養
カプサイシンって知ってるー？

# Perfect Chikipa MIX / パーフェクトチキパMIX | Theme | 0 |  | id=chikipa-perfect
ライオン
トラ
チーター
ラタラタ
ラトラーター
栄養
栄養
栄養
栄養
カプサイシンって知ってるー？
栄養過多で脂肪肝～♪

# Variable Chikipa MIX / 可変チキパMIX | Advanced | 0 |  | id=chikipa-kahen
ラトラーター！
イェイェイェ！
ラ！
ラト！
ラトラ！
ラトラッ！
ラトラッ！
ラトッ！
ラトッ！
ラトラァタァ～！

# Deara-Stage / ディアステ | Theme | 0 |  | id=deastage
桃 栗
芋 乳
妹(もうと) 油
段ボール

# Deara-Stage (English) / ディアステ（英語） | Theme | 0 |  | id=deastage-en
ピンク マロン
ポテツ バスト
シスター オイリー
ダンボックス

# Sakuma (Drop) / サクマー（drop） | Theme | 0 |  | id=sakuma
シャイニー ファイヤー
サンダー ウォーター
ネイチャー ポイズン
サクマー

陽 炎
雷 水
緑 毒
サクマと上昇

チュプ ウヒュイ
カンナ ワッカ
カムイ スルク
サクマホプンパ

# Nanaland / ナナランド | Theme | 0 |  | id=nanaland
シャイニー ファイヤー
スター ウォーター
ネイチャー ウインド
ラブリー

陽 炎
星(せい) 水
緑 風(ふう)
愛ナナランド

チュプ ウヒュイ
ノチウ ワッカ
カムイ レラ
カタイロッケ

# Mou-Carry / 妄キャリ | Theme | 0 |  | id=moucarry
ディスティネーション
スローモーション
コンビネーション
グラジュエーション

インビテーション
テンプテーション
レボリューション
悲しみキャリブレーション

# Kishoutenketsu Jo-Ha-Kyu / 起承転結序破急 | Theme | 0 |  | id=kishoten
水 金 地 火 木
土 天 海 冥
起 承 転 結
序 破 急

# G.O.D / G.O.D（神激） | Theme | 0 |  | id=god
【発動】よっしゃ降臨
アテナ ゼウス
アレス ガイア
セレス カオス
ヘリオス

# Kuji Chant / 九字 | Koujou | 0 |  | phrases | id=kuji
臨 兵 闘 者
皆 陣 列在前

# Itsu Ikuno? / いつ行くの？ | Theme | 0 |  | id=itsuikuno
ウーハイウーハイ
ウーハイウーハイ
あー 👏 👏
まだ行かない

ウーハイウーハイ
ウーハイウーハイ
あー 👏 👏
まだ行かない

いつ行くの？
今でしょう？
あー 👏 👏
しゃー行くぞ
> (⇒各種MIX)

# Yoshi Ikuzo / 吉幾三 | Theme | 0 |  | id=yoshiikuzo
【発動】吉幾三
テレビもねぇ ラジオもねぇ
クルマもそれほど走ってねぇ
ピアノもねぇ バーもねぇ
お巡り毎日ぐーるぐる

# Mori Mitsuko Koujou / 森光子 口上 | Koujou | 0 |  | phrases | id=morimitsuko
言いたいことは
△△ない
森光子
森光子

みんなで一緒に
えぶりばでぃぱっしょん
んーんー
んーんー

空からみててね
光子さん
あなたの名前を
叫びます

森光子
森光子
ばちかわ天使の
森光子
[も り み つ
こー]

# Encore Call / アンコール | Basic | 0 |  | id=encore
> (各種MIX⇒)
アンコール
アンコール
アンコール
しゃー行くぞ
> (⇒各種MIX)

# Zettai Ryouiki / 絶対領域なやつ | Koujou | 0 |  | phrases | id=zettai
完！ 全！
聖！ 域！
絶対領域
ニーハイオーハイ

缶チューハイ
ウーロンハイ
ナチュラルハイ
アップルパイ

三角チョコパイ
エンゼルパイ
タオパイパイ
ファールフライ

ピッチャーフライ
キャッチャーフライ
センターフライ
アイキャンフライ

# Pan MIX / パン | Theme | 0 |  | id=pan
パンパンパン
ポケモンパン
フレッシュブレッド
伊藤パン

松たか子
松たか子
ヤマザキ春の
パン祭り

フランスパン
メロンパン
アンパンからの
アンパンチ

ドキンちゃん
ドキンちゃん
ドキンの妹
コキンちゃん

# Pan MIX 2 / パン2 | Theme | 0 |  | id=pan-2
パンパンパン
ポケモンパン
フレッシュブレッド
伊藤パン

アンパン 食パン
カレーパン
ヤマザキ春の
パン祭り

# Bunmeido / 文明堂 | Theme | 0 |  | id=bunmeido
カステラ1番
電話は2番
3時のおやつは
文明堂

# Excalibur / エクスカリバー | Theme | 0 |  | id=excalibur
サガ ムウ
氷河 魔鈴
アイオリア 釈迦
もう一度俺に光を見せてくれ
目覚めよ我がエクスカリバー

# Pegasus / ペガサス | Theme | 0 |  | id=pegasus
【発動】ペガサス
フェニックス ドラゴン
キグナス アンドロメダ
アテナ 燃え上れ
俺の小宇宙(おれのコスモ)
○○は俺が守る

# Magic MIX / 魔法 | Theme | 0 |  | id=magic
メラ イオ ヒャド
パルプンテ
エクスペクト
パトローナム

# Burning / バーニング | Theme | 0 |  | id=burning
【発動】あーーーー
バーニング バーニング
バーニング バーニング
バーニング バーニング
燃えるぜ バーニング

# Gundam Seed / ガンダム種 | Theme | 0 |  | id=gundam
【発動】俺がガンダムだ
ストライク イージス
ブリッツ バスター
デュエル ジャスティス
フリーダム

# Men MIX / 麺MIX | Theme | 0 |  | id=men
麺麺麺麺
ジャージャー麺
つるっと喉越し
三田製麺

かけうどん
かけうどん
赤いーきつねと
緑のたぬき

# Pizza MIX / ピザMIX | Theme | 0 |  | id=pizza
【発動】しゃー焼くぞ
ビスマルク バンビーノ
カプリチョーザ リモーネ
フンギ トンナータ
マルゲリータ ジェノア
[クアトロフォルマッジョ]

# Tokioli Mermaid / 時折マーメイド | Advanced | 0 |  | id=mermaid
除去 飛
化繊 振動
海女 繊維
振動 人造 火

虎 火
虎 火
除去 除去 除去 除去
虎 火 人造 繊維

海女 振動
化繊 飛
除去 跳
海鵜 舞
農場

# Accele Finale Japa Kahen / アッチェレ終幕ジャパ可変 | Advanced | 16 |  | b4 | id=accele
> Uses the MCH chant rows. Its speed markers apply to displayed rows 8–10 at 4×, not to the whole chant. The article groups calls differently and marks separate 2×, 4×, and song-dependent passages. Slower delivery can extend the 16-bar form by two or more bars.
農場 舞
海鵜 跳
除去 飛 化繊 振動
海女 繊維 人造 火

虎 火
虎 火
虎 虎 虎 虎
虎 火 人造 繊維 海女 振動

海女 振 海女 振 海女 振動
海女 繊 海女 繊 人造 火
虎 火 人造 繊維
海女 振動

化繊 飛
除去 跳
海鵜 舞
農場

# Eto / 干支 | Theme | 0 |  | id=eto
子(ね) 丑(うし)
寅(とら) 卯(う)
子(ね) 丑(うし) 寅(とら) 卯(う)
辰(たつ) 巳(み)

午(うま) 未(ひつ)
申(さる) 酉(とり)
午(うま) 未(ひつ) 申(さる) 酉(とり)
戌(いぬ) 亥(い)

# Seiza / 星座 | Theme | 0 |  | id=seiza
【発動】ギャラクシー
カプリコ ヴェルソー
ポワッソン ベリエ
トロ― ジェモー
カンセ リオン
ヴィエルジュ バランス
スコルピオン サジッテール

# Douyou / 童謡 | Theme | 0 |  | id=douyou
グー チョキ パー で
グー チョキ パー で
何作ろう？
何作ろう？

右手が パーで
左手も パーで
ミョーホントゥスケ
👏 ワイパー

大きな栗の
木下で
あなたと
ワールドカオス

諸行 木暮
時雨 神楽
金剛山
翔襲叉

# Sankaku Kansuu / 三角関数 | Theme | 0 |  | id=sankaku
俺とお前の
赤い糸
おーれの俺の
○○

いやいやいやいや
いやいやいやいや
おーれー
の○○

サイン コサイン
タンジェント
トライアングル
ドリーマー

# Gachikoi Koujou (Short) / ガチ恋（ショート） | Koujou | 0 |  | phrases | id=gachikoi-short
言いたいことが
あるんだよ
やっぱり○○
かわいいよ

好き好き大好き
やっぱ好き
世界で一番
愛してる
[あ い し て るー]

# Gachikoi Koujou (Shin) / ガチ恋口上（真） | Koujou | 0 |  | phrases | id=gachikoi-shin
言いたいことがあるけれど
うまく言葉にできなくて
好き好き目を見て言えたなら
こんなに苦しくないのかな

僕がこれから生きる理由
○○の笑顔が見たいから
僕だけの笑顔じゃないけれど
君だけの僕でいたいんだ
[いたいんだ]

# Gachikoi Kahen 3-Ren / ガチ恋可変3連 | Advanced | 0 |  | id=gachikoi-kahen
言いたいことが ファイボワイパー
やっぱり タイガー
タタタタ タイガー

好き好き 大好き
チャペ アペ カラ キナ
やっと見つけた
👏 ワイパー

俺が 生まれて
虎虎 カラキナ
それは お前と
海女海女 ジャスパー

俺と一緒に
虎 タイガー
世界で一番
イエッタイガー
[イエッタイガー]

# Sakura Namiki Koujou (Hachimitsu Emperor) / 桜並木の口上（蜂蜜★皇帝） | Koujou | 0 |  | phrases | id=sakura-namiki
桜並木の
風に舞い
メルヘンロックに
飛び回る

いつでも全力
まっすぐに
てっぺん目指して
突き進め

刺されたい奴は
ついてこい
We are 蜂蜜
エンペラー

# Gachikoi (Manekecha: Arikitari na Kotoba de) / ガチ恋（まねケチャありきたりな言葉で） | Koujou | 0 |  | phrases | id=gachikoi-mane
言いたいことが
あるんだよ
やっぱり○○
かわいいよ

好き好き大好き
やっぱ好き
やっと見つけた
お姫様

俺が生まれて
きた理由
それはお前に
出会うため

俺と一緒に
人生歩もう
ここから先は
また後で
ま た あ と でー
> (⇒落ちサビ)
世界で一番愛してる

# Manekecha Kimi ga Waraeba / まねケチャ君が笑えば（深瀬加入期） | Koujou | 0 |  | phrases | id=manekecha-kimi
美優 千愛
凛ちゃん
玲緒菜 美桜(みーお)
まねきケチャ

# Manekecha Kimiwazurai / まねケチャきみわずらい | Koujou | 0 |  | phrases | id=manekecha-kimiwazurai
美優がかわいい
超かわいい
千愛がかわいい
超かわいい

凛ちゃんかわいい
超かわいい
玲緒菜がかわいい
超かわいい

美桜ちゃんかわいい
超かわいい もう
全員かわいい
超かわいい

# Iroha-uta Koujou (chuLa) / いろは唄口上（chuLa） | Koujou | 0 |  | phrases | id=iroha
色は匂えど
散りぬるを
我が世誰ぞ
常ならん

有為の奥山
今日越えて
浅き夢見じ
酔いもせず

天下無双の
雄叫びで
桜花爛漫
咲き誇れ

狂乱麗舞の
名の下に
咲かせて魅せよ
五星ノ華

# Gachikoi MIX / ガチ恋MIX | Koujou | 0 |  | phrases | id=gachikoi-mix
言いたいことが
あるんだよ
やっぱり○○
しゃー行くぞ
(⇒スタンダード)

俺が生まれて
きた理由
それはオマエと
しゃー行くぞ
(⇒ジャパニーズ)

俺と一緒に
人生歩もう
世界で一番
しゃー行くぞ
(⇒アイヌ)

# Gorgeous Koujou / ゴージャス口上 | Koujou | 0 |  | phrases | id=gorgeous
言いたいことが
レボリューション
やっぱり君は
ファンタスティック

Want you Want you
やっぱ好き
やっと見つけた
デスティニー

俺が生まれた
カンボジア
それはお前と
パラグアイ

俺と一緒に
人生アラスカ
世界で一番
マダガスカル
[マ ダ ガ ス カ ル]

# Mazakon Koujou / マザコン | Koujou | 0 |  | phrases | id=mazakon
言いたいことが
あるんだよ
やっぱり○○
かわいいよ

母を訪ねて
三千里
やっと見つけた
お母さん

俺が生まれて
きた理由
それはママに
出会うため

俺と一緒に
おうちへ帰ろう
ママのご飯が
食べたいよ
[た べ た い よー]

# Yamiame / 病雨 | Theme | 0 |  | id=yamiame
【発動】よっしゃキメるぞ
デパス ブロン
マイスリー レキソ
レスタ ハルシオン
サイレース
[イエッ まんげ
エターナル]

# Juri-tatari / ジュリ祟 | Theme | 0 |  | id=juritatari
ドル ユーロ
ポンド ペソ
ウォン 円 元
バブリー

# BANZAI JAPAN Koujou / BANZAI JAPAN | Koujou | 0 |  | phrases | id=banzai
大和の歌姫
舞い降りて
BANZAI JAPANの
お出ましだ

太鼓の音色を
轟かせ
大名側室
いざ参らん

世界の夜明けの
その日まで
皆で声出し
よっしゃ行くぞ

# Camoufla Koi no Mahou / カモフラ恋の魔法 | Koujou | 0 |  | phrases | id=camoufla
> After the opening chorus: まだまだ解けない 恋の魔法. After the first chorus: そろそろ解けるよ 恋の魔法. After the final chorus: やっぱり解けない 恋の魔法. These placements are specific to this source's song call.
まだまだ解けない
恋の魔法

そろそろ解けるよ
恋の魔法

やっぱり解けない
恋の魔法

# Mikeneko (Original) / 三毛猫（初期） | Koujou | 0 |  | phrases | id=mikeneko
言いたいことが
あるんだよ
やっぱり三毛猫
しゃー行くぞ

れな ありこ
ちろる りおん
まどか むつき
かっちゅみーん

俺が生まれて
きた理由
それはオマエと
しゃー行くぞ

鶏(とり) 蟻(あり)
兎(う) 獅子(しし)
龍(りゅう) 狗(いぬ)
猫(かっちゅみーん)

俺と一緒に
人生歩もう
世界で一番
しゃー行くぞ
> (⇒アイヌ)

# Mikeneko (Rebuild) / 三毛猫（リビルド中） | Koujou | 0 |  | phrases | id=mikeneko-rebuild
言いたいことが
あるんだよ
やっぱり三毛猫
しゃー行くぞ

ちろるー
りおんー
まどかー
かっちゅみーん

俺が生まれて
きた理由
それはオマエと
しゃー行くぞ

兎ー(うー)
獅子ー(ししー)
龍ー(りゅうー)
眼鏡ー(めがねー)

俺と一緒に
人生歩もう
世界で一番
しゃー行くぞ
> (⇒アイヌ)

# Fever Call / フィーバーコール | Theme | 0 |  | id=chape-tora
チャペ虎タイガー
オニツカタイガー
ブラックサンダー
怒りの獣神(いかりのじゅうしん)
サンダーライガー
`;
