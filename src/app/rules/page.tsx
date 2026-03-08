'use client'

import Navbar from '@/components/Navbar'

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-200">
      <Navbar title="Luật chơi Werewords" backHref="/" />
      
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full leading-relaxed">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
            🎯 Mục tiêu
          </h2>
          <p>
            Dân làng cố gắng đoán đúng **Từ bí mật** bằng cách đặt câu hỏi "Có/Không". Ma sói biết từ đó và phải ngăn dân làng mà không bị lộ diện.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
            🎭 Vai trò chính
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <h3 className="font-bold text-purple-400 mb-1">👑 Mayor (Quản trò)</h3>
              <p className="text-sm text-gray-400">
                Biết Từ bí mật. Trả lời câu hỏi bằng các thẻ: ✅ Có, ❌ Không, ⚠️ Có lẽ, 🤏 Suýt đúng. Mayor không được nói!
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <h3 className="font-bold text-blue-400 mb-1">👁️ Nhà tiên tri (Seer)</h3>
              <p className="text-sm text-gray-400">
                Thuộc phe Dân làng. Biết Từ bí mật và phải kín đáo giúp dân làng đoán đúng mà không để Ma sói phát hiện.
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <h3 className="font-bold text-red-400 mb-1">🐺 Ma sói (Werewolf)</h3>
              <p className="text-sm text-gray-400">
                Biết Từ bí mật. Phải tìm cách gây nhiễu và làm lãng phí thời gian để dân làng không đoán được.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
            ⚖️ Kết thúc ván chơi
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-white">Nếu Dân làng đoán ĐÚNG:</h3>
              <p className="text-sm text-gray-400">
                Ma sói lộ diện và có 15 giây để tìm ai là Nhà tiên tri. Nếu tìm đúng, Ma sói thắng. Nếu sai, Dân làng thắng.
              </p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-white">Nếu Dân làng đoán SAI (Hết giờ):</h3>
              <p className="text-sm text-gray-400">
                Dân làng có 1 phút để thảo luận và bỏ phiếu tìm Ma sói. Nếu tìm đúng Ma sói, Dân làng thắng. Nếu sai, Ma sói thắng.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center text-gray-600 text-xs">
          Trích dẫn từ luật chơi chính thức của Werewords.
        </section>
      </div>
    </div>
  )
}
