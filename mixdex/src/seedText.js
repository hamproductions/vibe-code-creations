// Community MIX / koujou memo → MIXDEX seed text.
// Header:  # English name / 日本語名 | Category | Bars | Trigger context | flags
// flags: b2 / b4 = baisoku (2x / 4x) passages, id=slug
// Body: see parse.js for the chant DSL.
export const SEED_TEXT = String.raw`
# Kahen MIX (Starter Cue) / 可変MIX（発動の合図） | Basic | 4 | Right before the Standard MIX kicks in | id=kahen-starter
> Often triggered by a shouted 「はい、せーの！」. Played just before the Standard MIX.
ミョーホン トゥスケ 化繊 飛 除去
ジャージャー
ファイボ
ワイパー

# Konton MIX (Gyaku / Reverse) / 混沌（逆順） | Advanced | 8 | Ochisabi — after the forward Konton | id=konton-gyaku
> Either chained right after the forward version or used alone depending on the song length.
しょ×6 翔襲叉
金剛山
神楽 時雨 木暮 諸行
ワールドカオス

# Hayashi-sensei MIX / 林先生MIX | Basic | 8 | Right before the Standard MIX (Hatsudou) | id=hayashi
> Leads straight into the Standard MIX. Some venues replace the claps with "あー".
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

# Pan MIX (Short) / パンMIX（短縮） | Theme | 8 | Interlude after verse 2 | id=pan-short
パン パン パン パン ポケモン パン
フレッシュ ブレッド 伊藤パン
松たか子 松たか子
ヤマザキ 春の パン祭り

# Hindi Accele / ヒンディー（ヒンドゥー）アッチェレ | Advanced | 16 | Accele (rapid-fire) section | b4 | id=hindi-accele
> Speed marks in the source: lines 2 and 5 are 2x, the bracketed line is 4x, the angle-bracket line is 2x or 1x depending on the song.
ケート ニルティヤ パクシー クードナー
ハターナ ウダーン クリトリマタントゥー カンパン ゴタコー タントゥ サイバラ
バー アグ バー アグ
バーバーバーバー バーグ サイトゥゴタカンパン
ゴタパンゴタパンゴタカンパン ゴタトゥゴタトゥサイバラアグ
バー アグ サイバラ タントゥ ゴタコー カンパン クリトリマタントゥー
ウダーン ハターナ クードナー
パクシー ニルティヤ ケート

# Thomas MIX / トーマスmix | Theme | 8 | Interlude | id=thomas
【発動】出発進行
トーマス ゴードン ヘンリー パーシー
トビー エドワード ポッポー

# Suirenka Kashou / 睡蓮花歌唱 | Theme | 4 | Short gap | id=suirenka
> Only the call is documented in the ranking post.
○○で沸けるの誰ですか？
俺！×4 ore！×2

# Ginga Koujou (Galaxy Koujou) / 銀河口上 | Koujou | 12 | Long interlude — Standard-Enchou length (12 bars incl. start) | id=ginga
> Exactly 12 bars with the start call. Often entered with the "Uryao-i" Hayashi start, so it can also be felt as Kahen 3-ren length. Origin: the intro of Idol College's "Seifuku Koi Monogatari" (early 2010s), later popularised via Nijicon's "Paradoxical Complex".
銀河に轟く歌声と
地球に花咲くその笑顔
お前が好きだと輝き叫ぶ
行くぜ全力どこまでも
光のごとく駆け巡る
好きじゃねぇ 愛してる

# Ginga Koujou — Cancel Italian / 銀河口上キャンセルイタリア | Advanced | 16 | Long interlude / outro | id=ginga-italian
> The final 愛してる is swapped for the Italian MIX start call (アンディアモ), the usual way Ginga is cancelled into another MIX.
銀河に轟く歌声と
地球に花咲くその笑顔
お前が好きだと輝き叫ぶ
行くぜ全力どこまでも
光のごとく駆け巡る
好きじゃねぇ アンディアモ

ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィヴラメント
テクノボラーレ
アスティラッツィオーネ

# Rascal MIX / ラスカルmix | Theme | 8 | Interlude (2025 MIX of the year) | id=rascal
> By Takeutin. "三生オタク" = a fan reborn with every oshi change. 丸の内 is the creator's old Nagoya address. Many derivatives exist (see the Yoji-con list).
ラスカル×4
あー 👏 👏 丸の内
清川 みれぴ に ゆーほ
ガチ恋加速が止まらない
結婚は ごめんなさい
三生オタクラスカルズ
たけうてぃん たけうてぃん
たけうちまさやって知ってる？
[すーえーなーがーかーのーちゃーん！]

# Gachikoi Rascal Kahen / ガチ恋ラスカル可変 | Theme | 8 | Interlude | id=rascal-gachikoi
言いたいラスカルあるんだよ
やっぱり君は丸の内
好き好き大好き後藤まつり
やっと見つけた 止まらない
俺が産まれてごめんなさい
それはオタクラスカルズ
俺と一緒にたけうていん
たけうちまさや愛してる

# Ultimate Rascal / アルティメットラスカル | Theme | 16 | Long interlude | id=rascal-ultimate
> Identical text is circulated as "Captain Rascals" (キャプテンラスカルズ).
言いたいことがファイボラスカル
やっぱりまさやはグリフィンタイガー
アクシオチャペアペ丸の内
ガチ恋まさやとお姫様
ファイヤー俺と結婚カラキナ
それはファーマーごめんなさい
俺とタイガーラスカルズ
たけうちまさやでイェッタイガー

# Yoruba MIX / ヨルバ語mix | Language Variant | 8 | Outro / cancel from koujou | id=yoruba
> Yoruba is spoken in south-west Nigeria. Its "除去" slot is ヨ, which makes the reverse form (Gachikoi Yoruba) slot neatly into a Gachi Koi cancel.
【発動】エジェカロ
アモテクン イナ イシェオウォエニヤン
オウ オビンリンオルウェオミ イジヤ
[オウケミカリ フォ ヨ]

# Ura Yoruba (Yoruba 2-ren) / 裏ヨルバ（ヨルバ語2連） | Language Variant | 16 | Long outro | id=yoruba-2
【発動】エジェカロ
アモテクン イナ イシェオウォエニヤン
オウ オビンリンオルウェオミ イジヤ

エジャエニヤン オリシャオビンリン
ケレシメシ エランオデクン
アンジェリ シンデレラ
アアイェ イレアライェアジェサラ

# Yoruba 3-Ren / ヨルバ語3連 | Advanced | 24 | Longest outro | id=yoruba-3
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

# Gachikoi Yoruba (Gyaku-uchi) / ガチ恋ヨルバ（逆打ち） | Advanced | 16 | Gachi Koi cancel | id=yoruba-gachikoi
> Cancel at 「やっぱり○○は可愛いヨ」: the Yoruba reverse starts on that ヨ, which is considered the cleanest Gachi Koi cancel of any language.
言いたいことがあるんだよ
やっぱり○○は可愛いヨ
フォ オウケミカリ イジヤ
オビンリン オルウェオミ オウ
イシェオウォエニヤン
イナ アモテクン エジェカロ

# Standard MIX (Short Ending) / スタンダード（短縮） | Basic | 8 | Song start | id=std-short
タイガー ファイヤー
サイバー ファイバー
ダイバー バイバー
ジャージャー

# Japanese MIX (Short Ending) / ジャパニーズ（最後を短縮） | Basic | 8 | Second interlude | id=jp-short
虎 火
人造 繊維
海女 振動
化繊飛除去(かっせんとびじょーきょー)

# Japanese MIX (Tora-Hi Hatsudou) / 日本語MIX（虎火発動） | Language Variant | 8 | Long interlude between verse 1 and 2 | id=jp-torahi
虎×12 虎 火 人造 繊維 海女 振動 化繊 飛 除去

# Japanese MIX (Gyaku-uchi) / 日本語MIX（逆打ち） | Advanced | 8 | Second interlude | b2 | id=jp-gyaku
虎 火 人造 繊維 海女 振動 化繊 飛 除去 飛 化繊 振動 海女 繊維 人造 火 [倍速]
虎 虎 火 火 人造 人造 繊維 繊維 海女 振動 化繊 飛 除去

# Ainu MIX (Sunny) / アイヌ（晴） | Language Variant | 4 | Short gap | id=ainu-sun
カムイ ホロカプ
アーホイヨ

# Ainu MIX (Rain) / アイヌ（雨） | Language Variant | 4 | Short gap | id=ainu-rain
カムイ ポプニカ
アーホイヨ

# Enchou MIX / 園長 | Language Variant | 8 | Interlude | id=enchou
ファイボ ワイパー
ファーマー ジャスパー
ホワイパー クーパー
イエスクレイパー

# Miyamoto Musashi (Enchou Japa) / 宮本武蔵（園長ジャパ） | Language Variant | 8 | Interlude | id=musashi
飛 除去
農 正
拭 樽
宮本武蔵

# Kurofuku MIX / 黒服 | Language Variant | 8 | Interlude | id=kurofuku
ファイボ ワイパー
ジャンパー ピンガー
ダンス ファーマー
[サブリ フィンガー]
[セイブ バイザー]

# Spanish MIX (1-ren) / スペイン（1連で終わるやつ） | Language Variant | 8 | Outro | id=spanish-1
【発動】バーモス
ティグレ フェゴ
シベル フィブラ
ブゾ ビブラル
ヘルセイ
[ボラーレ リンピラ
パラブリサス]

# Spanish MIX (2-3 ren) / スペイン（2連～3連） | Language Variant | 16 | Outro | id=spanish-3
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

# German MIX / ドイツ | Language Variant | 8 | Outro | id=german
【発動】ゲーエンヴィアー
ティーガァ フォイエル
クゥンスト フィーバー
タゥツァー シュビングング
ヒェーミーファーザー
[フィリーゲン カールハインツ-
-シュナイダー]

# German MIX (Ura) / 裏ドイツ | Language Variant | 16 | Outro | id=german-ura
【発動】ゲーエンヴィアー
ティーガァ フォイエル
クゥンスト フィーバー
タゥツァー シュビングング
ヒェーミーファーザー

フィリーゲン バザィティガン
ゼーユングファー ゲッティン
ヴァイナハテン レン
ヘルマンカルツ カールハインツ-
-シュナイダー

# German MIX (3-ren) / ドイツ3連 | Advanced | 16 | Long outro | id=german-3
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

# Italian MIX / イタリア | Language Variant | 8 | Outro | id=italian
【発動】アンデャーモ
ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィブラメント
テクノボラーレ
[アストラッツィオーネ]

# Italian MIX (Ura) / 裏イタリア | Language Variant | 16 | Outro | id=italian-ura
【発動】アンデャーモ
ティーグレ フォーコ
レプリカンテ フィーブラ
バロンバーロ ヴィブラメント
シレーナ デーア

ナターレ レンナ
アンジェロ チェネレントラ
スパツィオ パェゼデレ
メラヴィリェ アストラッ-
-チィオーネ

# Italian MIX (3-ren) / イタリア3連 | Advanced | 16 | Long outro | id=italian-3
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
プレイアディ チェーロ-
-スッテラート

# Korean MIX / ハングル | Language Variant | 8 | Outro | id=korean
【発動】チャカダー
ホランイ ブル
インジョ ソミュ
ヘニョ シンド
ファハクソミュ
[ネウダ ジェゴ]

# Thai MIX / タイ | Language Variant | 8 | Outro | id=thai
シーアー ファイマイ
トローン ファイブー
ブラダーナー スターン
サンコラー ビン
カーカムチャー

# Arabic MIX / アラビア | Language Variant | 8 | Outro | id=arabic
【発動】スフィリアスィール
ナミル ナール
スィナーイ ナスィージュ
ガタサ ハッザ
ハイトゥンシナーイ

# Russian MIX / ロシア | Language Variant | 8 | Outro | id=russian
> The rhythm is uncertain in the source memo.
チーグル アゴーニ
キビェル ヴァラクノ
モーリェ バーバラ
ヴィバラツィヤ ヒーミャ
[リターチ ウダリェニエ]

# Vietnamese MIX / ベトナム | Language Variant | 8 | Outro | id=vietnamese
【発動】ジュントイセー
ティーガル チャイ
キーバル ソイ
トゥーラン ロン
ソイトンホップ

# Chinese MIX / 中国 | Language Variant | 8 | Outro | id=chinese
ラオフー フオ
レンジャオ シェンウェイ
ハイニィ ジェンドン
ホァシェン
[フェイ チュウチィ]

# Favoria Star MIX / ファボリアスター | Language Variant | 8 | Interlude | id=favoria
ジャージャー ファイボ
インジョ ジャスパー
ビブラル 化繊
イエスクレイパー
[ナルダ ファボリアスター]

# Takemin Original Perfect / タケミンオリジナルパーフェクト | Advanced | 16 | Long outro | id=takemin
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

# Shikou / 至高 | Language Variant | 8 | Interlude | id=shikou
ファスタスチーパ
アステステロン
パストマーブ
スタッツレーザル

スプンタアールマティ
パストビレイジョン

# Myohontusuke Square / ミューホントゥスケ広場 | Language Variant | 8 | Interlude | id=myohon-square
ミョーホントゥスケ
化繊飛除去
ジャージャー ファイボ
ワイパー

# Myohon Driver Square / ミョーホンドライバー広場 | Language Variant | 8 | Interlude | id=myohon-driver
ミョーホン ドライバー
化繊 飛 ライガー
ジャッジャー ジャッジャー
バリバリボー
ストストストスト
ストライパー

# Kahen 3-Ren (Original Triple) / 可変3連（本来の可変3連） | Advanced | 16 | Long interlude | id=kahen-orig
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

# Kahen 3-Ren (4-ren length) / 可変3連（4連の尺があるやつ） | Advanced | 16 | Long interlude (4-ren length) | id=kahen-4ren
人造ファイヤファ
イボワイパー
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

# Kahen 3-Ren 2 / 可変3連2 | Advanced | 16 | Long interlude (4-ren length) | id=kahen-2
人造ファーマ繊
維ジャスパー
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

# Ainu-Nichi Kahen / アイ日可変 | Advanced | 8 | Ochisabi lead-in interlude | id=ainu-nichi
ウィースぺ ケスィ
チャペ チャペ チャペ
チャペ アぺ カラ キナ
カラ アぺ チャペ

除去 飛 除去
虎 虎 虎
虎 火 人造 繊維
海女 振動 化繊
[飛 除去]

# Captain Tsubasa Kahen 3-Ren / キャプテン翼可変3連 | Advanced | 16 | Long interlude | id=tsubasa
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

# Hogwarts MIX / ホグワーツ | Theme | 8 | Interlude | id=hogwarts
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

# Ultimate MIX / アルティメットMIX | Advanced | 16 | Long interlude | id=ultimate
言いたいことがファ
イボマルフォイ
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

# Japanese 3x-speed Kahen / ジャパニーズ3倍速可変 | Advanced | 8 | Interlude | b2 | id=jp-3x
> Called "3x" but only reaches roughly 1.5–2.0x in practice.
海女虎人造(あまとらじんぞう)
海女虎化繊(あまとらかせん)
除去虎人造(じょきょとらじんぞう)
海女繊維虎(あませんとら)

海女繊維除去飛(あませんじょきょとび)
振動繊維化繊飛(しんせんかせとび)
除去虎振動(じょきょとらしんどう)
海女虎火(あまとらひ)

# Kahen (Unnamed) / 可変（そのうち名前つける） | Advanced | 8 | Interlude | id=kahen-unnamed
チスパ ジャーマ
舞農場
チャペ虎タイガー
ストライパー

除去飛除去
虎虎虎
振繊除去飛
海女虎火

# Kahen (Mange) / 可変（まんげ） | Advanced | 4 | Short gap | id=kahen-mange
チャペ虎タイガー
ファーマージャスパー
イエッ まんげ
エターナル

# Kahen (Favoria Star) / 可変（ファボリアスター） | Advanced | 4 | Short gap | id=kahen-favoria
イエッ ナルダ ファ
ボリアスター

# Japanese Baisoku Omote-Ura / ジャパニーズ（倍速表裏） | Advanced | 8 | Interlude | b2 | id=jp-baisoku
虎火人造繊維
海女振動化繊飛
除去飛化繊振動
海女繊維人造火

# Ainu Baisoku Kahen / アイヌ（倍速可変） | Advanced | 8 | Interlude | b2 | id=ainu-baisoku
チャペアペカラキナ
チャペアペカラキナ
チャペアペカラキナ
ミョーホントゥスケ

# Standard-Japa-Ainu Blend / スタジャパアイヌ混合 | Advanced | 16 | Long interlude | id=blend
チャペ虎タイガー
アぺ火ファイヤー
カラ人造サイバー
キナ繊維ファイバー

ララ海女ダイバー
トゥスケ振動バイバー
イエッ ウィスペ
化繊ジャージャー

# Karan Ichishiki -Rei- / 華嵐 一式-麗- | Theme | 8 | Interlude | id=karan
桜(サクラ) 椿(ツバキ)
菖蒲(アヤメ) 黒百合(クロユリ)
楓(カエデ) 睡蓮(スイレン)
杜若(カキツバタ)

# Hanabi MIX / 花火 | Theme | 8 | Interlude | id=hanabi
【発動】5 4
【発動】321
菊(キク) 牡丹(ボタン)
瀧(タキ) 蜂(ハチ)
千輪(センリン) 葉落(ヨウラク)
冠菊(カムロギク)

# Seven Lucky Gods / 七福神 | Theme | 8 | Interlude | id=shichifuku
【発動】七福即生
恵比寿 福禄
弁財 寿老
布袋 大黒
毘沙門天

# Tales MIX / テイルズ | Theme | 8 | Interlude | id=tales
【発動】よっしゃ秘奥義
震天 裂空
斬光 旋風
滅砕 神罰
割殺撃

# Gokui / 極意 | Advanced | 16 | Long interlude | id=gokui
虎 火
人造 繊維
海女 振動
化繊 飛

除去 忠実
刹那 刻
高陽 心髄
極意 魂
伝承

# Konton MIX (Chaos, Ochisabi) / 混沌 | Advanced | 8 | Ochisabi or interlude | id=konton-short
【発動】ワールドカオス
諸行 木暮
時雨 神楽
金剛山
翔襲叉(しょうしゅうしゃ)
[黒雲 無常
世界混沌]

# Ashura Konton / 阿修羅混沌 | Advanced | 16 | Heavy drop or long interlude | id=ashura-konton
【発動】ワールドカオス
諸行 木暮
時雨 神楽
金剛山
翔襲叉

極運 夢境
冥界 強剛
ナウダ マモリア
スター

# Tanbo no Yousu / 田んぼの様子 | Theme | 8 | Interlude gag | id=tanbo
農林業
水産業
魚の様子も
👏 おかしい

# Koshihikari / コシヒカリ | Theme | 4 | Short gap gag | id=koshihikari
コシヒカリ
ササニシキ
イヤイヤイヤイヤ
マテマテマテマテ

# Yousuiro / 用水路 | Theme | 4 | Short gap gag | id=yousuiro
用水路
コンバイン
田んぼの様子が
👏 おかしい

# Tatatata Taiga 3-Ren / タタタタタイガー3連 | Advanced | 16 | Long interlude (6-ren length) | id=tata-3
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

# Tatatata Taiga 3-Ren (Full) / タタタタタイガー3連 フル | Advanced | 16 | Longest interlude | id=tata-3-full
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

# Chikipa MIX / チキパ | Theme | 8 | Interlude | id=chikipa
> Length is cut to fit the gap; some venues drop everything from 栄養 onward. Chains well after Ainu-Nichi Kahen.
ライオン トラ
チーター
ラタラタ ラト
ラーター

サイ ゴリラ
ゾウ
サゴーゾー
サゴーゾー

栄養×8
カプサイシンって
知ってるー？
[栄養過多で
脂肪肝]

# Deara-Stage / ディアステ | Theme | 8 | Interlude | id=deastage
桃 栗
芋 乳
妹(もうと) 油
段ボール

# Deara-Stage (English) / ディアステ（英語） | Theme | 8 | Interlude | id=deastage-en
ピンク マロン
ポテツ バスト
シスター オイリー
ダンボックス

# Sakuma (Drop) / サクマー（drop） | Theme | 16 | Drop | id=sakuma
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

# Nanaland / ナナランド | Theme | 16 | Drop | id=nanaland
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

# Mou-Carry / 妄キャリ | Theme | 8 | Interlude | id=moucarry
ディスティネーション
スローモーション
コンビネーション
グラジュエーション

インビテーション
テンプテーション
レボリューション
悲しみキャリブ
レーション

# Kishoutenketsu Jo-Ha-Kyu / 起承転結序破急 | Theme | 8 | Interlude | id=kishoten
水 金 地 火 木
土 天 海 冥
起 承 転 結
序 破 急

# G.O.D / G.O.D（神激） | Theme | 8 | Interlude | id=god
【発動】よっしゃ降臨
アテナ ゼウス
アレス ガイア
セレス カオス
ヘリオス
臨 兵 闘 者
皆 陣 列在前

# Itsu Ikuno? / いつ行くの？ | Theme | 8 | Pre-MIX gag | id=itsuikuno
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

# Yoshi Ikuzo / 吉幾三 | Theme | 4 | Short gap gag | id=yoshiikuzo
【発動】吉幾三
テレビもねぇ ラジオもねぇ
クルマもそれほど走ってねぇ
ピアノもねぇ バーもねぇ
お巡り毎日ぐーるぐる

# Mori Mitsuko Koujou / 森光子 口上 | Koujou | 16 | Gag outro | id=morimitsuko
言いたいことは
ない
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

# Encore Call / アンコール | Basic | 4 | Encore | id=encore
アンコール
アンコール
アンコール
しゃー行くぞ

# Zettai Ryouiki / 絶対領域なやつ | Koujou | 8 | Second verse A-melody | id=zettai
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

# Pan MIX / パン | Theme | 8 | Interlude after verse 2 | id=pan
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

# Pan MIX 2 / パン2 | Theme | 8 | Interlude after verse 2 | id=pan-2
パンパンパン
ポケモンパン
フレッシュブレッド
伊藤パン

アンパン 食パン
カレーパン
ヤマザキ春の
パン祭り

# Bunmeido / 文明堂 | Theme | 4 | Short gap gag | id=bunmeido
文明堂
カステラ1番
電話は2番
3時のおやつは
文明堂

# Excalibur / エクスカリバー | Theme | 8 | Interlude | id=excalibur
サガ ムウ
氷河 魔鈴
アイオリア 釈迦
もう一度俺に光を見せてくれ
目覚めよ我がエクスカリバー

# Pegasus / ペガサス | Theme | 8 | Interlude | id=pegasus
【発動】ペガサス
フェニックス ドラゴン
キグナス アンドロメダ
アテナ 燃え上れ
俺の 小宇宙(コスモ)
○○は俺が守る

# Magic MIX / 魔法 | Theme | 4 | Short gap | id=magic
メラ イオ ヒャド
パルプンテ
エクスペクト
パトローナム

# Burning / バーニング | Theme | 8 | Interlude | id=burning
【発動】あーーーー
バーニング バーニング
バーニング バーニング
バーニング バーニング
燃えるぜ バーニング

# Gundam Seed / ガンダム種 | Theme | 8 | Interlude | id=gundam
【発動】俺がガンダムだ
ストライク イージス
ブリッツ バスター
デュエル ジャスティス
フリーダム

# Men MIX / 麺MIX | Theme | 8 | Interlude | id=men
麺麺麺麺
ジャージャー麺
つるっと喉越し
三田製麺

かけうどん
かけうどん
赤いーきつねと
緑のたぬき

# Pizza MIX / ピザMIX | Theme | 8 | Interlude | id=pizza
【発動】しゃー焼くぞ
ビスマルク バンビーノ
カプリチョーザ リモーネ
フンギ トンナータ
マルゲリータ ジェノア
[クアトロフォルマッジョ]

# Tokioli Mermaid / 時折マーメイド | Advanced | 16 | Interlude | b2 | id=mermaid
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

# Accele Finale Japa Kahen / アッチェレ終幕ジャパ可変 | Advanced | 16 | Finale | b4 | id=accele
農場 舞
海鵜 跳
除去 飛 化繊 振動
海女 繊維 人造 火

虎 火
虎 火
虎 虎 虎 虎
虎 火 人造 繊維 海女 振(←倍倍速)動

海女 振 海女 振 海女 振(←倍倍速)動
海女 繊 海女 繊(←倍倍速) 人造 火
虎 火 人造 繊維
海女 振動

化繊 飛
除去 跳
海鵜 舞
農場

# Eto / 干支 | Theme | 8 | Interlude | id=eto
子(ね) 丑(うし)
寅(とら) 卯(う)
子(ね) 丑(うし) 寅(とら) 卯(う)
辰(たつ) 巳(み)

午(うま) 未(ひつじ)
申(さる) 酉(とり)
午(うま) 未(ひつじ) 申(さる) 酉(とり)
戌(いぬ) 亥(い)

# Seiza / 星座 | Theme | 8 | Interlude | id=seiza
【発動】ギャラクシー
カプリコ ヴェルソー
ポワッソン ベリエ
トロ― ジェモー
カンセ リオン
ヴィエルジュ バランス
スコルピオン サジッテール

# Douyou / 童謡 | Theme | 8 | Interlude | id=douyou
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

# Sankaku Kansuu / 三角関数 | Theme | 8 | Interlude | id=sankaku
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

# Gachikoi Koujou (Short) / ガチ恋（ショート） | Koujou | 8 | Short interlude or outro | id=gachikoi-short
言いたいことが
あるんだよ
やっぱり○○
かわいいよ

好き好き大好き
やっぱ好き
世界で一番
愛してる
[あ い し て るー]

# Gachikoi Koujou (Shin) / ガチ恋口上（真） | Koujou | 16 | Emotional interlude | id=gachikoi-shin
言いたいことがあるけれど
うまく言葉にできなくて
好き好き目を見て言えたなら
こんなに苦しくないのかな

僕がこれから生きる理由
○○の笑顔が見たいから
僕だけの笑顔じゃないけれど
君だけの僕でいたいんだ
[いたいんだ]

# Gachikoi Kahen 3-Ren / ガチ恋可変3連 | Advanced | 16 | Long interlude | id=gachikoi-kahen
言いたいことが ファ
イボワイパー
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

# Sakura Namiki Koujou (Hachimitsu Emperor) / 桜並木の口上（蜂蜜★皇帝） | Koujou | 16 | Group original | id=sakura-namiki
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

# Gachikoi (Manekecha: Arikitari na Kotoba de) / ガチ恋（まねケチャありきたりな言葉で） | Koujou | 16 | Emotional interlude | id=gachikoi-mane
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

# Manekecha Kimi ga Waraeba / まねケチャ君が笑えば（深瀬加入期） | Koujou | 16 | Group original | id=manekecha-kimi
美優 千愛
凛ちゃん
玲緒菜 美桜(みーお)
まねきケチャ

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

# Iroha-uta Koujou (chuLa) / いろは唄口上（chuLa） | Koujou | 16 | Group original | id=iroha
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

# Gachikoi MIX / ガチ恋MIX | Koujou | 16 | Chained into 3-ren | id=gachikoi-mix
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

# Gorgeous Koujou / ゴージャス口上 | Koujou | 16 | Emotional interlude | id=gorgeous
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

# Mazakon Koujou / マザコン | Koujou | 16 | Gag outro | id=mazakon
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

# Yamiame / 病雨 | Theme | 8 | Interlude | id=yamiame
【発動】よっしゃキメるぞ
デパス ブロン
マイスリー レキソ
レスタ ハルシオン
サイレース
[イエッ まんげ
エターナル]

# Juri-tatari / ジュリ祟 | Theme | 4 | Short gap | id=juritatari
ドル ユーロ
ポンド ペソ
ウォン 円 元
バブリー

# BANZAI JAPAN Koujou / BANZAI JAPAN | Koujou | 16 | Group original | id=banzai
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

# Camoufla Koi no Mahou / カモフラ恋の魔法 | Koujou | 4 | After chorus | id=camoufla
まだまだ解けない
恋の魔法
そろそろ解けるよ
恋の魔法
やっぱり解けない
恋の魔法

# Mikeneko (Original) / 三毛猫（初期） | Koujou | 16 | Group original | id=mikeneko
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

# Mikeneko (Rebuild) / 三毛猫（リビルド中） | Koujou | 16 | Group original | id=mikeneko-rebuild
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

# Chape Tora Taiga Call / チャペ虎タイガー | Basic | 4 | Outro (short instrumental) | id=chape-tora
世界で一番
愛して止まない
○○に捧げる
チャペ虎タイガー
チャペ×8
I LOVE YOU！
`;
